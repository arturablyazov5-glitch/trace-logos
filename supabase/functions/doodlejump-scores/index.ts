import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

// POST /doodlejump-scores  → публично. Сохраняет лучший результат игрока.
//                            body: { name, score }
// GET  /doodlejump-scores  → публично. Топ-20 глобального лидерборда.
//                            (используется вкладкой "Global" в пасхалке Doodle Jump)

// Забег занимает минимум секунды — обычная сессия шлёт один POST раз в
// 10-30с. GET (открытие вкладки Global) может дёргаться чаще при листании UI.
const POST_RATE_LIMIT = 20;
const GET_RATE_LIMIT = 60;
const RATE_WINDOW_SECONDS = 60;

// Явно отсекаем нереалистичные счета — по механике игры (набор высоты +
// бонусы) результат за сотни тысяч физически недостижим за разумное время
// и почти наверняка подделан на клиенте.
const MAX_SCORE = 5_000_000;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGIN') || '*')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

function resolveOrigin(requestOrigin: string | null): string {
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) return requestOrigin;
  return ALLOWED_ORIGINS[0] || '*';
}

function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function cleanName(s: unknown): string {
  return String(s ?? '').replace(/[<>"']/g, '').trim().slice(0, 40);
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method === 'POST') {
    const rate = await checkRateLimit(req, 'doodlejump-scores', POST_RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.ok) return json(origin, { error: 'Too many requests' }, 429);

    let payload: { name?: string; score?: number };
    try {
      payload = await req.json();
    } catch (_) {
      return json(origin, { error: 'Invalid JSON' }, 400);
    }

    const name = cleanName(payload.name) || 'unnamed';
    const score = Math.round(Number(payload.score));
    if (!Number.isFinite(score) || score <= 0 || score > MAX_SCORE) {
      return json(origin, { error: 'Invalid score' }, 400);
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_doodlejump_score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ p_name: name, p_score: score }),
    });
    if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
    return json(origin, { ok: true });
  }

  if (req.method === 'GET') {
    const rate = await checkRateLimit(req, 'doodlejump-scores-get', GET_RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.ok) return json(origin, { error: 'Too many requests' }, 429);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/doodlejump_scores?select=name,score&order=score.desc&limit=20`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
    return json(origin, { scores: await res.json() });
  }

  return json(origin, { error: 'Method not allowed' }, 405);
});
