-- Карта скроллинга статей блога.
-- Одна строка = «сколько сеансов докрутили статью РОВНО до этого сегмента и не дальше».
-- bucket: 0..19, сегмент i соответствует глубине (i+1)*5% тела статьи (.blog-body).
-- Накопительный охват считается на чтении: reach(i) = sum(count) по bucket >= i.

CREATE TABLE IF NOT EXISTS public.scroll_depth (
    slug   TEXT     NOT NULL,
    bucket SMALLINT NOT NULL,
    count  BIGINT   NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (slug, bucket)
);

ALTER TABLE public.scroll_depth ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_scroll_depth(p_slug TEXT, p_bucket INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_slug IS NULL OR p_slug = '' THEN
        RETURN;
    END IF;
    IF p_bucket IS NULL OR p_bucket < 0 OR p_bucket > 19 THEN
        RETURN;
    END IF;

    INSERT INTO public.scroll_depth (slug, bucket, count, updated_at)
    VALUES (p_slug, p_bucket, 1, now())
    ON CONFLICT (slug, bucket)
    DO UPDATE SET count = public.scroll_depth.count + 1, updated_at = now();
END;
$$;

GRANT ALL ON TABLE public.scroll_depth TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_scroll_depth(TEXT, INT) TO postgres, service_role;
