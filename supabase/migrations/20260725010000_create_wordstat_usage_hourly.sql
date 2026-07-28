-- Часовой счётчик, зеркалящий реальную квоту Яндекса для Wordstat: 100 запросов/час.
-- (Дневной лимит у Yandex Search API для Wordstat не документирован вообще — только часовой,
-- см. https://github.com/yandex-cloud/docs/blob/master/en/_includes/search-api-limits.md)
CREATE TABLE IF NOT EXISTS public.wordstat_usage_hourly (
    hour_key TEXT PRIMARY KEY, -- 'YYYY-MM-DD"T"HH24', час по UTC
    requests INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.increment_wordstat_usage_hourly(p_count INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
    key TEXT := to_char(now() AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24');
BEGIN
    INSERT INTO public.wordstat_usage_hourly (hour_key, requests)
    VALUES (key, p_count)
    ON CONFLICT (hour_key)
    DO UPDATE SET requests = public.wordstat_usage_hourly.requests + p_count
    RETURNING requests INTO new_total;
    RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON TABLE public.wordstat_usage_hourly TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_wordstat_usage_hourly(INTEGER) TO postgres, service_role;
