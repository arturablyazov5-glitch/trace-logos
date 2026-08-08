import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// POST /aboutfactcheck  → x-admin-key + body: { items: [{figma, name, about}] }
//
// В отличие от aboutqa (тот просто спрашивает YandexGPT «на глаз», без выхода в интернет —
// см. supabase/functions/aboutqa), эта функция дёргает Yandex GENERATIVE SEARCH API
// (POST /v2/gen/search, gRPC-сервис GenSearchService.Search с REST-транскодингом,
// see yandex/cloud/searchapi/v2/gen_search_service.proto) — модель реально формулирует
// поисковый запрос, ищет в индексе Яндекса и отвечает со ссылками на источники (sources).
// Это единственный режим, ради которого стоит тратить бюджет aistudio.yandex — обычный
// YandexGPT completion (aboutqa) не отличается от того, что Claude сделал бы сам.
//
// Дорого: ₽5.08 / запрос (тариф Generative Search, синхронные запросы). Обрабатываем
// СТРОГО по одному item за вызов (не батчами, как aboutqa/brandurl) — иначе одна модель
// на несколько разных брендов в одном запросе размывает поисковый контекст.

const ADMIN_KEY        = Deno.env.get('ADMIN_KEY') || '';
const YANDEX_API_KEY   = Deno.env.get('YANDEX_AI_API_KEY') || '';
const YANDEX_FOLDER_ID = Deno.env.get('YANDEX_FOLDER_ID') || '';

const GEN_SEARCH_URL = 'https://searchapi.api.cloud.yandex.net/v2/gen/search';
const PRICE_PER_REQUEST_RUB = 5.08;

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || '*')
  .split(',').map((s: string) => s.trim()).filter(Boolean);

function resolveOrigin(req: Request): string {
  const o = req.headers.get('origin');
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (o && ALLOWED_ORIGINS.includes(o)) return o;
  return ALLOWED_ORIGINS[0] || '*';
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// grpc-gateway REST-транскодинг стримингового ответа отдаёт последовательность JSON-объектов
// без гарантированного разделителя (может быть \n, может не быть) — парсим по балансу скобок,
// а не по строкам.
function splitJsonObjects(text: string): unknown[] {
  const out: unknown[] = [];
  let depth = 0, start = -1, inStr = false, esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; continue; }
    if (c === '{') { if (depth === 0) start = i; depth++; }
    else if (c === '}') {
      depth--;
      if (depth === 0 && start >= 0) {
        try { out.push(JSON.parse(text.slice(start, i + 1))); } catch { /* skip malformed chunk */ }
        start = -1;
      }
    }
  }
  return out;
}

interface Source { url: string; title: string; used: boolean; }
interface FactCheckRow {
  figma: string;
  name: string;
  answer: string | null;
  sources: Source[];
  searchQueries: string[];
  isAnswerRejected: boolean;
  error: string | null;
}

const PROMPT = (name: string, about: string) => `Ты дотошный факт-чекер. Ниже текст об истории и статусе бренда "${name}" \
с карточки логотипа сайта каталога логотипов. Найди в интернете актуальную информацию о бренде и:
1) Укажи, есть ли в тексте фактические неточности или устаревшие данные (конкретные даты, цифры, статусы — \
не придирайся к стилю).
2) Дай 1-3 свежих интересных факта о бренде, которых в тексте нет (жизнь бренда после публикации текста, \
ребрендинги, изменения статуса и т.п. — только то, что подтверждается источниками).
Отвечай кратко и по делу, двумя абзацами: "Неточности:" и "Новые факты:". Если неточностей нет — напиши \
"Неточностей не найдено".

Текст:
${about}`;

async function checkOne(item: { figma: string; name: string; about: string }): Promise<FactCheckRow> {
  const body = {
    messages: [{ content: PROMPT(item.name, item.about), role: 'ROLE_USER' }],
    folderId: YANDEX_FOLDER_ID,
    getPartialResults: false,
  };

  try {
    const res = await fetch(GEN_SEARCH_URL, {
      method: 'POST',
      headers: { Authorization: `Api-Key ${YANDEX_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return { figma: item.figma, name: item.name, answer: null, sources: [], searchQueries: [], isAnswerRejected: false, error: `${res.status}: ${text.slice(0, 200)}` };
    }
    const raw = await res.text();
    const chunks = splitJsonObjects(raw) as Array<Record<string, unknown>>;
    if (!chunks.length) {
      return { figma: item.figma, name: item.name, answer: null, sources: [], searchQueries: [], isAnswerRejected: false, error: 'Пустой ответ от Generative Search API' };
    }
    // Финальный чанк содержит полный накопленный текст + итоговые sources/searchQueries.
    const last = chunks[chunks.length - 1];
    const answer = (last.message as { content?: string } | undefined)?.content ?? null;
    const sources = ((last.sources as Source[] | undefined) ?? []).map(s => ({ url: s.url, title: s.title, used: !!s.used }));
    const searchQueries = ((last.searchQueries as Array<{ text: string }> | undefined) ?? []).map(q => q.text);
    return {
      figma: item.figma, name: item.name, answer, sources, searchQueries,
      isAnswerRejected: !!last.isAnswerRejected, error: null,
    };
  } catch (e) {
    return { figma: item.figma, name: item.name, answer: null, sources: [], searchQueries: [], isAnswerRejected: false, error: String(e) };
  }
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });

  if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
    return json(origin, { error: 'Unauthorized' }, 401);
  }
  if (req.method !== 'POST') return json(origin, { error: 'POST only' }, 405);
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    return json(origin, { error: 'YANDEX_AI_API_KEY / YANDEX_FOLDER_ID не настроены' }, 500);
  }

  let payload: { items?: unknown };
  try { payload = await req.json(); } catch (_) { return json(origin, { error: 'Invalid JSON' }, 400); }

  const items = Array.isArray(payload.items) ? payload.items as Array<{ figma: string; name: string; about: string }> : [];
  if (!items.length) return json(origin, { error: 'items: [{figma,name,about}][] required' }, 400);
  if (items.length > 30) {
    return json(origin, { error: 'Максимум 30 items за вызов (₽5.08/шт — держим предсказуемый расход за один запрос)' }, 400);
  }

  const results: FactCheckRow[] = [];
  for (const item of items) {
    results.push(await checkOne(item));
    await sleep(300);
  }

  const billed = results.filter(r => !r.error).length;
  return json(origin, {
    results,
    checked: items.length,
    billed,
    spentRub: Math.round(billed * PRICE_PER_REQUEST_RUB * 100) / 100,
    pricePerRequestRub: PRICE_PER_REQUEST_RUB,
  });
});
