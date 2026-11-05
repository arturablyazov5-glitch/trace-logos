CREATE TABLE public.ads_support_v1 (
    browser_id UUID PRIMARY KEY,
    with_ads BOOLEAN GENERATED ALWAYS AS (left(browser_id::text, 1) IN ('0', '1', '2', '3', '4', '5', '6', '7')) STORED,
    first_click_at TIMESTAMPTZ
);

ALTER TABLE public.ads_support_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ads_support_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.ads_support_v1 TO service_role;

CREATE FUNCTION public.record_ads_support_v1(p_browser_id UUID, p_clicked BOOLEAN)
RETURNS VOID
LANGUAGE sql
SET search_path = ''
AS $$
    INSERT INTO public.ads_support_v1 (browser_id, first_click_at)
    VALUES (p_browser_id, CASE WHEN p_clicked THEN now() END)
    ON CONFLICT (browser_id) DO UPDATE
    SET first_click_at = excluded.first_click_at
    WHERE public.ads_support_v1.first_click_at IS NULL
      AND excluded.first_click_at IS NOT NULL;
$$;

CREATE FUNCTION public.get_ads_support_v1()
RETURNS TABLE (with_ads BOOLEAN, browsers BIGINT, clicked BIGINT)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
    SELECT experiment.with_ads, count(*), count(experiment.first_click_at)
    FROM public.ads_support_v1 AS experiment
    GROUP BY experiment.with_ads;
$$;

REVOKE ALL ON FUNCTION public.record_ads_support_v1(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_ads_support_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_ads_support_v1(UUID, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_ads_support_v1() TO service_role;
