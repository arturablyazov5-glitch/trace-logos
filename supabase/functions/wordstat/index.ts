import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// POST /wordstat  → только x-admin-key. body: { phrases: string[], region?: string }
//                   Прогоняет каждый бренд через официальный Yandex Wordstat API (GetTop,
//                   Search API v2 / AI Studio) с запросом «логотип <бренд>» и отдаёт
//                   частотность по России.
//
// Без собственных лимитов расхода — единственное ограничение здесь DELAY_MS между
// запросами, чтобы не словить реальную квоту Яндекса (10 req/s у Wordstat API).
// Тарификация: Яндекс биллит только успешные (2xx) запросы к GetTop — 0.02₽/шт.

const ADMIN_KEY        = Deno.env.get('ADMIN_KEY') || '';
const YANDEX_API_KEY   = Deno.env.get('YANDEX_AI_API_KEY') || '';
const YANDEX_FOLDER_ID = Deno.env.get('YANDEX_FOLDER_ID') || '';

const WORDSTAT_URL = 'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests';
const DEFAULT_REGION = '225'; // Россия
const MAX_PHRASES = 150; // держим суммарное время запроса в пределах лимита Edge Function
const DELAY_MS = 130; // ~7-8 req/s — с запасом от лимита Wordstat API (10 req/s)

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || '*')
  .split(',').map(s => s.trim()).filter(Boolean);

function resolveOrigin(requestOrigin: string | null): string {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] || '*';
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface WordstatRow { brand: string; phrase: string; total: number; topAssociation: string | null; error: string | null; }

async function checkOne(brand: string, region: string): Promise<WordstatRow> {
  const phrase = `логотип ${brand}`.trim();
  try {
    const res = await fetch(WORDSTAT_URL, {
      method: 'POST',
      headers: { Authorization: `Api-Key ${YANDEX_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase, numPhrases: 3, regions: [region], folderId: YANDEX_FOLDER_ID }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { brand, phrase, total: -1, topAssociation: null, error: `${res.status}: ${text.slice(0, 160)}` };
    }
    const data = await res.json();
    const total = Number(data.totalCount || 0);
    const topAssoc = (data.associations || [])[0];
    return {
      brand, phrase, total,
      topAssociation: topAssoc ? `${topAssoc.phrase} (${topAssoc.count})` : null,
      error: null,
    };
  } catch (e) {
    return { brand, phrase, total: -1, topAssociation: null, error: String(e) };
  }
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return json(origin, { error: 'Unauthorized' }, 401);
  }

  if (req.method !== 'POST') {
    return json(origin, { error: 'Method not allowed' }, 405);
  }

  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    return json(origin, { error: 'Wordstat API не настроен на сервере (нет YANDEX_AI_API_KEY/YANDEX_FOLDER_ID)' }, 500);
  }

  let payload: { phrases?: unknown; region?: unknown };
  try {
    payload = await req.json();
  } catch (_) {
    return json(origin, { error: 'Invalid JSON' }, 400);
  }

  const phrases = Array.isArray(payload.phrases)
    ? payload.phrases.map(p => String(p ?? '').trim()).filter(Boolean)
    : [];
  if (!phrases.length) return json(origin, { error: 'phrases: string[] is required' }, 400);
  if (phrases.length > MAX_PHRASES) {
    return json(origin, { error: `Слишком много фраз за раз (максимум ${MAX_PHRASES}), разбей список на части` }, 400);
  }
  const region = typeof payload.region === 'string' && payload.region.trim() ? payload.region.trim() : DEFAULT_REGION;

  const results: WordstatRow[] = [];
  for (const brand of phrases) {
    results.push(await checkOne(brand, region));
    await sleep(DELAY_MS);
  }
  results.sort((a, b) => b.total - a.total);

  const billed = results.filter(r => !r.error).length; // тарифицируются только успешные

  return json(origin, { results, checked: phrases.length, billed, region });
});
