-- Убирает карту скроллинга статей блога (глубина дочитывания) — фичу вырезали из
-- клиента (js/blog-scroll-map.js), Edge Function (supabase/functions/track/index.ts)
-- и админки (admin/index.html, вкладка «Статьи»). Таблица и функция инкремента
-- больше никем не читаются и не пишутся.
DROP FUNCTION IF EXISTS public.increment_scroll_depth(TEXT, INT);
DROP TABLE IF EXISTS public.scroll_depth;
