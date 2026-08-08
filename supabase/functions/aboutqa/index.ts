import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// POST /aboutqa  → x-admin-key + body: { items: [{figma, name, about}] }
// Для каждого item просит YandexGPT сыграть редактора-критика: найти
// неточности (непроверяемые/подозрительные факты, даты, цифры), штампы и
// «нейросетевые» обороты в уже написанном тексте `about`. НИЧЕГО не
// переписывает и не придумывает новые факты — только диагностика существующего
// текста, чтобы не плодить новые галлюцинации поверх старых.

const ADMIN_KEY        = Deno.env.get('ADMIN_KEY') || '';
const YANDEX_API_KEY   = Deno.env.get('YANDEX_AI_API_KEY') || '';
const YANDEX_FOLDER_ID = Deno.env.get('YANDEX_FOLDER_ID') || '';

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

const SYSTEM_PROMPT = `Ты — дотошный редактор-критик. Тебе дают уже ГОТОВЫЕ тексты об истории брендов
(поле "about" на карточке логотипа). Твоя задача — только диагностика, ничего не переписывать
и не придумывать новые факты.

Для каждого текста проверь:
1. factCheck — есть ли в тексте конкретные факты (даты, цифры, суммы, "первый/крупнейший/старейший"),
   которые звучат подозрительно, непроверяемо или похожи на выдумку/устаревшие данные. Перечисли их
   как список строк (пустой массив, если фактов, вызывающих сомнение, нет). Не помечай общеизвестные
   факты как подозрительные.
2. clicheAiVoice — штампы и «нейросетевой» стиль: обороты вида "не X, а Y", "это не просто X, а Y",
   канцеляризмы ("важно понимать", "стоит отметить", "таким образом"), размытые прилагательные без
   точного признака ("настоящий", "уникальный", "самый лучший" без цифры/факта рядом), более двух
   метафор в тексте, симметричные шаблонные предложения. Перечисли найденное как список строк
   (пустой массив, если ничего нет).
3. severity — "ok" если оба списка пустые, "minor" если есть 1-2 мелких пункта, "rewrite" если текст
   стоит переписать целиком.

Верни JSON-массив объектов с полями: figma (как передано), factCheck, clicheAiVoice, severity.
Отвечай ТОЛЬКО валидным JSON-массивом, без markdown, без текста до и после.`;

async function askGPT(items: Array<{figma: string; name: string; about: string}>): Promise<unknown> {
  const userText = items.map(it =>
    `figma: ${it.figma}\nname: ${it.name}\nabout: ${it.about}`
  ).join('\n\n---\n\n');

  const body = {
    modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt/latest`,
    completionOptions: { stream: false, temperature: 0.1, maxTokens: 2000 },
    messages: [
      { role: 'system', text: SYSTEM_PROMPT },
      { role: 'user', text: userText },
    ],
  };

  const res = await fetch('https://llm.api.cloud.yandex.net/foundationModels/v1/completion', {
    method: 'POST',
    headers: {
      Authorization: `Api-Key ${YANDEX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YandexGPT ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const text: string = data?.result?.alternatives?.[0]?.message?.text ?? '';

  const clean = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  return JSON.parse(clean);
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

  const items = Array.isArray(payload.items) ? payload.items as Array<{figma: string; name: string; about: string}> : [];
  if (!items.length) return json(origin, { error: 'items: [{figma,name,about}][] required' }, 400);

  // Батчи по 8 — тексты about длиннее, чем url, бережём контекст модели
  const BATCH = 8;
  const results: unknown[] = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      const r = await askGPT(batch) as unknown[];
      results.push(...(Array.isArray(r) ? r : [r]));
    } catch (e) {
      results.push(...batch.map((it: {figma: string}) => ({ figma: it.figma, error: String(e) })));
    }
    if (i + BATCH < items.length) await sleep(400);
  }

  return json(origin, { results });
});
