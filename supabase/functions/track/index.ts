import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';

// POST  /track            → публично. Инкремент счётчика просмотров логотипа или статьи.
//                           body: { figma, name?, img? } OR { slug } OR { banner }
// GET    /track           → только с заголовком x-admin-key == ADMIN_KEY (секрет).
//                           Отдаёт всю статистику для админки.
// DELETE /track            → только с заголовком x-admin-key == ADMIN_KEY (секрет).
//                           body: { searchQuery } → удаляет одну строку из search_queries.
//                           body: { mergeFrom, mergeInto } → объединяет две строки search_queries
//                           (суммирует count, сохраняет более свежий last_seen/results_count),
//                           удаляет mergeFrom.
//                           без тела → полный сброс logo_stats/export_stats.

// Лимит намеренно щедрый: обычный сеанс листания каталога (virtual scroll) легко
// генерирует десятки view-событий за минуту — это не злоупотребление.
const RATE_LIMIT = 120;
const RATE_WINDOW_SECONDS = 60;

const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_KEY     = Deno.env.get('ADMIN_KEY') || '';

// ALLOWED_ORIGIN — список через запятую, напр.:
// "https://trace-logos.ru,http://localhost:3000,http://127.0.0.1:3000"
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
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function clean(s: unknown, max: number): string {
  return String(s ?? '').replace(/[<>"']/g, '').trim().slice(0, max);
}

serve(async (req: Request) => {
  const origin = resolveOrigin(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  // ── Запись (публично) ───────────────────────────────────────────────
  if (req.method === 'POST') {
    const rate = await checkRateLimit(req, 'track', RATE_LIMIT, RATE_WINDOW_SECONDS);
    if (!rate.ok) return json(origin, { error: 'Too many requests' }, 429);

    let payload: {
      figma?: string; name?: string; img?: string; format?: string; variant?: string;
      slug?: string; // New field for blog posts
      searchQuery?: string; resultsCount?: number; // Поиск в шапке каталога
      banner?: string; // Клик по промо-баннеру (напр. sidebar landologovo)
    };
    try {
      payload = await req.json();
    } catch (_) {
      return json(origin, { error: 'Invalid JSON' }, 400);
    }

    // --- Search Query Tracking ---
    const searchQuery = clean(payload.searchQuery, 200);
    if (searchQuery) {
      const resultsCount = Number.isFinite(payload.resultsCount) ? Math.max(0, Math.trunc(payload.resultsCount!)) : 0;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_search_query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ p_query: searchQuery, p_results_count: resultsCount }),
      });
      if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      return json(origin, { ok: true });
    }

    // --- Banner Click Tracking ---
    const banner = clean(payload.banner, 100);
    if (banner) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_banner_click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ p_banner_id: banner }),
      });
      if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      return json(origin, { ok: true });
    }

    // --- Blog Post Tracking ---
    const slug = clean(payload.slug, 300);
    if (slug) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ post_slug: slug }),
      });
      if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      return json(origin, { ok: true });
    }

    // --- Logo Tracking ---
    const figma = clean(payload.figma, 300);
    if (!figma) return json(origin, { error: 'figma or slug is required' }, 400);

    const format = clean(payload.format, 20);
    if (format) {
      // Трекинг экспорта (скачивание / копирование)
      const variant = clean(payload.variant, 500);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ p_figma: figma, p_format: format, p_variant: variant }),
      });
      if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      return json(origin, { ok: true });
    }

    // Трекинг просмотра логотипа
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
    if (!res.ok) return json(origin, { error: 'DB error', detail: await res.text() }, 500);
    return json(origin, { ok: true });
  }

  // ── Чтение статистики (только админ) ───────────────────────────────────
  if (req.method === 'GET') {
    if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
      return json(origin, { error: 'Unauthorized' }, 401);
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
      return json(origin, { error: 'DB error', detail: await res.text() }, 500);
    }

    const exports = await fetch(
      `${SUPABASE_URL}/rest/v1/export_stats?select=figma,format,variant,count&order=count.desc`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );

    const postViews = await fetch(
      `${SUPABASE_URL}/rest/v1/post_views?select=slug,count&order=count.desc`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );

    const searchQueries = await fetch(
      `${SUPABASE_URL}/rest/v1/search_queries?select=query,count,results_count,last_seen&order=count.desc&limit=2000`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );

    const bannerClicks = await fetch(
      `${SUPABASE_URL}/rest/v1/banner_clicks?select=banner_id,count,updated_at&order=count.desc`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );

    return json(origin, {
      views: await res.json(),
      exports: exports.ok ? await exports.json() : [],
      post_views: postViews.ok ? await postViews.json() : [],
      search_queries: searchQueries.ok ? await searchQueries.json() : [],
      banner_clicks: bannerClicks.ok ? await bannerClicks.json() : [],
    });
  }

  // ── Сброс статистики (только админ) ─────────────────────────────────
  if (req.method === 'DELETE') {
    if (!ADMIN_KEY || req.headers.get('x-admin-key') !== ADMIN_KEY) {
      return json(origin, { error: 'Unauthorized' }, 401);
    }

    // Точечное удаление одной поисковой фразы — тело { searchQuery: "..." }.
    // Объединение двух фраз — тело { mergeFrom: "...", mergeInto: "..." }.
    // Полный сброс (без тела / без searchQuery/merge*) идёт дальше по коду и статистику поиска не трогает.
    let payload: { searchQuery?: string; mergeFrom?: string; mergeInto?: string } = {};
    try {
      payload = await req.clone().json();
    } catch (_) {
      // тела нет — это полный сброс, ниже по коду
    }

    const mergeFrom = clean(payload.mergeFrom, 200);
    const mergeInto = clean(payload.mergeInto, 200);
    if (mergeFrom && mergeInto) {
      if (mergeFrom === mergeInto) {
        return json(origin, { error: 'mergeFrom и mergeInto совпадают' }, 400);
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/merge_search_queries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
        body: JSON.stringify({ p_from: mergeFrom, p_into: mergeInto }),
      });
      if (!res.ok) {
        return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      }
      return json(origin, { ok: true });
    }

    const searchQuery = clean(payload.searchQuery, 200);
    if (searchQuery) {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/search_queries?query=eq.${encodeURIComponent(searchQuery)}`,
        {
          method: 'DELETE',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        },
      );
      if (!res.ok) {
        return json(origin, { error: 'DB error', detail: await res.text() }, 500);
      }
      return json(origin, { ok: true });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reset_logo_stats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: '{}',
    });

    if (!res.ok) {
      return json(origin, { error: 'DB error', detail: await res.text() }, 500);
    }
    return json(origin, { ok: true });
  }

  return json(origin, { error: 'Method not allowed' }, 405);
});
