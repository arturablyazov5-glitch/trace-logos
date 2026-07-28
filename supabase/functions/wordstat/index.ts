import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// GET  /wordstat  → только x-admin-key. Отдаёт текущий расход, без обращения к Yandex.
// POST /wordstat  → только x-admin-key. body: { phrases: string[], region?: string }
//                   Прогоняет каждый бренд через официальный Yandex Wordstat API (GetTop,
//                   Search API v2 / AI Studio) с запросом «логотип <бренд>» и отдаёт
//                   частотность по России.
//
// Лимиты:
// - Часовой (реальная квота Яндекса — 100 запросов/час, см.
//   github.com/yandex-cloud/docs/blob/master/en/_includes/search-api-limits.md) —
//   держим свой потолок чуть ниже (HOURLY_LIMIT), чтобы не словить их же 429.
// - Дневной (DAILY_LIMIT) — это НЕ лимит Яндекса, а наша собственная защита от случайного
//   разгона трат; у Yandex Wordstat дневного лимита в принципе нет, только часовой.
//
// Тарификация: Яндекс биллит только успешные (2xx) запросы к GetTop — 0.02₽/шт.
// Отклонённые квотой (429), невалидные (400) и неавторизованные (401/403) не тарифицируются.
// Поэтому в счётчик расхода идут ТОЛЬКО успешные вызовы, не все попытки.

const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_KEY        = Deno.env.get('ADMIN_KEY') || '';
const YANDEX_API_KEY   = Deno.env.get('YANDEX_AI_API_KEY') || '';
const YANDEX_FOLDER_ID = Deno.env.get('YANDEX_FOLDER_ID') || '';
const DAILY_LIMIT      = Number(Deno.env.get('WORDSTAT_DAILY_LIMIT') || '500');
const HOURLY_LIMIT     = Number(Deno.env.get('WORDSTAT_HOURLY_LIMIT') || '90'); // Яндекс: 100/час, держим запас

const WORDSTAT_URL = 'https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests';
const DEFAULT_REGION = '225'; // Россия
const MAX_PHRASES = 150; // держим суммарное время запроса в пределах лимита Edge Function
const DELAY_MS = 130; // ~7-8 req/s — с запасом от лимита Wordstat API (10 req/s)
const PRICE_PER_REQUEST_RUB = 0.02; // GetTop, прайс AI Studio: 20₽ / 1000 УСПЕШНЫХ запросов

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

async function restGet(path: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function rpc(name: string, body: Record<string, unknown>): Promise<number> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) return 0;
  return res.json();
}

async function getTodayUsage(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const rows = await restGet(`wordstat_usage?day=eq.${today}&select=requests`);
  return rows[0]?.requests || 0;
}

function currentHourKey(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)}T${String(d.getUTCHours()).padStart(2, '0')}`;
}

async function getHourUsage(): Promise<number> {
  const rows = await restGet(`wordstat_usage_hourly?hour_key=eq.${currentHourKey()}&select=requests`);
  return rows[0]?.requests || 0;
}

// Только УСПЕШНЫЕ запросы тарифицируются и должны попадать в оба счётчика.
async function addUsage(billableCount: number): Promise<{ day: number; hour: number }> {
  if (billableCount <= 0) return { day: await getTodayUsage(), hour: await getHourUsage() };
  const [day, hour] = await Promise.all([
    rpc('increment_wordstat_usage', { p_count: billableCount }),
    rpc('increment_wordstat_usage_hourly', { p_count: billableCount }),
  ]);
  return { day, hour };
}

function usagePayload(usedToday: number, usedThisHour: number) {
  return {
    usedToday, dailyLimit: DAILY_LIMIT, remainingToday: Math.max(0, DAILY_LIMIT - usedToday),
    usedThisHour, hourlyLimit: HOURLY_LIMIT, remainingThisHour: Math.max(0, HOURLY_LIMIT - usedThisHour),
    spentTodayRub: Math.round(usedToday * PRICE_PER_REQUEST_RUB * 100) / 100,
    pricePerRequestRub: PRICE_PER_REQUEST_RUB,
  };
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return json(origin, { error: 'Unauthorized' }, 401);
  }

  // ── Баланс/расход, без обращения к Yandex ──────────────────────────────
  if (req.method === 'GET') {
    const [day, hour] = await Promise.all([getTodayUsage(), getHourUsage()]);
    return json(origin, usagePayload(day, hour));
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

  const [usedDayBefore, usedHourBefore] = await Promise.all([getTodayUsage(), getHourUsage()]);
  const remaining = Math.min(
    Math.max(0, DAILY_LIMIT - usedDayBefore),
    Math.max(0, HOURLY_LIMIT - usedHourBefore),
  );
  if (remaining <= 0) {
    const reason = HOURLY_LIMIT - usedHourBefore <= 0
      ? `Часовой лимит исчерпан (${HOURLY_LIMIT}/час — под реальную квоту Яндекса). Остаток обнулится в начале следующего часа.`
      : `Дневной лимит исчерпан (${DAILY_LIMIT} запросов). Остаток обнулится в 00:00 UTC.`;
    return json(origin, { error: reason, usage: usagePayload(usedDayBefore, usedHourBefore) }, 429);
  }

  const toCheck = phrases.slice(0, remaining);
  const skipped = phrases.slice(remaining);

  const results: WordstatRow[] = [];
  for (const brand of toCheck) {
    results.push(await checkOne(brand, region));
    await sleep(DELAY_MS);
  }
  for (const brand of skipped) {
    results.push({ brand, phrase: `логотип ${brand}`, total: -1, topAssociation: null, error: 'Пропущено — упёрлись в лимит (часовой или дневной)' });
  }
  results.sort((a, b) => b.total - a.total);

  const billable = results.filter(r => !r.error).length; // тарифицируются только успешные
  const { day: usedDayAfter, hour: usedHourAfter } = await addUsage(billable);

  return json(origin, {
    results, checked: toCheck.length, billed: billable, skipped: skipped.length, region,
    usage: usagePayload(usedDayAfter, usedHourAfter),
  });
});
