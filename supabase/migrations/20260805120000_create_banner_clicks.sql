CREATE TABLE IF NOT EXISTS public.banner_clicks (
    banner_id TEXT PRIMARY KEY,
    count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_clicks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.increment_banner_click(p_banner_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_banner_id IS NULL OR p_banner_id = '' THEN
        RETURN;
    END IF;

    INSERT INTO public.banner_clicks (banner_id, count, updated_at)
    VALUES (p_banner_id, 1, now())
    ON CONFLICT (banner_id)
    DO UPDATE SET count = public.banner_clicks.count + 1, updated_at = now();
END;
$$;

GRANT ALL ON TABLE public.banner_clicks TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_banner_click(TEXT) TO postgres, service_role;
