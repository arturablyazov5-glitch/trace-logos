import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// POST  /track            → публично. Инкремент счётчика просмотров логотипа.
//                           body: { figma, name?, img? }
// GET   /track            → только с заголовком x-admin-key == ADMIN_KEY (секрет).
//                           Отдаёт всю статистику для админки.
//
// JWT для функции отключён (как у suggest/upload). Запись к БД идёт под
// service_role (Supabase инжектит SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_KEY     = Deno.env.get('ADMIN_KEY') || '';

function corsHeaders(): HeadersInit {
  const origin = Deno.env.get('ALLOWED_ORIGIN') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders() });
}

function clean(s: unknown, max: number): string {
  return String(s ?? '').replace(/[<>"']/g, '').trim().slice(0, max);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // ── Запись просмотра (публично) ────────────────────────────────────────
  if (req.method === 'POST') {
    let payload: { figma?: string; name?: string; img?: string };
    try {
      payload = await req.json();
    } catch (_) {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const figma = clean(payload.figma, 300);
    if (!figma) return json({ error: 'figma is required' }, 400);
    const name = clean(payload.name, 200);
    const img  = clean(payload.img, 500);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_logo_view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ p_figma: figma, p_name: name, p_img: img }),
    });

    if (!res.ok) {
      return json({ error: 'DB error', detail: await res.text() }, 500);
    }
    return json({ ok: true });
  }

  // ── Чтение статистики (только админ) ───────────────────────────────────
  if (req.method === 'GET') {
    if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/logo_stats?select=figma,name,img,views,updated_at&order=views.desc`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      },
    );

    if (!res.ok) {
      return json({ error: 'DB error', detail: await res.text() }, 500);
    }
    return json(await res.json());
  }

  return json({ error: 'Method not allowed' }, 405);
});
