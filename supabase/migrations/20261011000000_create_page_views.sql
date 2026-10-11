-- Просмотры страниц сайта: строка на путь (location.pathname), счётчик на каждую загрузку.
-- Пишет components/page-view.js через Edge Function track ({ page, title }),
-- читает вкладка «Страницы» в admin/index.html. title — последний document.title,
-- обновляется при каждом хите (чтобы переименованная страница не висела со старым).
CREATE TABLE IF NOT EXISTS public.page_views (
    path TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT '',
    count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_page_view(p_path TEXT, p_title TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_path IS NULL OR p_path = '' THEN
        RETURN;
    END IF;

    INSERT INTO public.page_views (path, title, count, updated_at)
    VALUES (p_path, COALESCE(p_title, ''), 1, now())
    ON CONFLICT (path)
    DO UPDATE SET
        count = public.page_views.count + 1,
        title = CASE WHEN EXCLUDED.title <> '' THEN EXCLUDED.title ELSE public.page_views.title END,
        updated_at = now();
END;
$$;

GRANT ALL ON TABLE public.page_views TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_page_view(TEXT, TEXT) TO postgres, service_role;
