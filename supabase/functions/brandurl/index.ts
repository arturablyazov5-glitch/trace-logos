import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// POST /brandurl  → x-admin-key + body: { items: [{figma, name, url}] }
// Для каждого item спрашивает YandexGPT: правильный ли это brandUrl?
// Если нет — предлагает лучший (брендбук / пресс / главная).

const ADMIN_KEY       = Deno.env.get('ADMIN_KEY') || '';
const YANDEX_API_KEY  = Deno.env.get('YANDEX_AI_API_KEY') || '';
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

const SYSTEM_PROMPT = `Ты помогаешь найти официальные страницы брендбуков и лого для брендов.
Для каждого бренда верни JSON-объект с полями:
- figma: как передано
- suggestedUrl: лучший URL (брендбук > пресс-страница > страница лого > главная сайта). Только реальный URL который точно существует.
- reason: короткое объяснение (на русском, 1 предложение)
- same: true если текущий URL уже оптимален, false если нашёл лучше

Отвечай ТОЛЬКО валидным JSON-массивом, без markdown, без текста до и после.`;

async function askGPT(items: Array<{figma: string; name: string; url: string}>): Promise<unknown> {
  const userText = items.map(it =>
    `figma: ${it.figma}\nname: ${it.name}\ncurrentUrl: ${it.url}`
  ).join('\n\n');

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

  // Убираем markdown-обёртку если есть
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

  const items = Array.isArray(payload.items) ? payload.items as Array<{figma: string; name: string; url: string}> : [];
  if (!items.length) return json(origin, { error: 'items: [{figma,name,url}][] required' }, 400);

  // Батчи по 10 чтобы не превышать контекст
  const BATCH = 10;
  const results: unknown[] = [];
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      const r = await askGPT(batch) as unknown[];
      results.push(...(Array.isArray(r) ? r : [r]));
    } catch (e) {
      results.push(...batch.map((it: {figma: string}) => ({ figma: it.figma, error: String(e) })));
    }
    if (i + BATCH < items.length) await sleep(500);
  }

  return json(origin, { results });
});
