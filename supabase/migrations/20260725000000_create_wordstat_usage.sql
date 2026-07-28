CREATE TABLE IF NOT EXISTS public.wordstat_usage (
    day DATE PRIMARY KEY,
    requests INTEGER NOT NULL DEFAULT 0
);

-- Атомарно добавляет p_count к счётчику текущего дня и возвращает новый итог.
CREATE OR REPLACE FUNCTION public.increment_wordstat_usage(p_count INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_total INTEGER;
BEGIN
    INSERT INTO public.wordstat_usage (day, requests)
    VALUES (CURRENT_DATE, p_count)
    ON CONFLICT (day)
    DO UPDATE SET requests = public.wordstat_usage.requests + p_count
    RETURNING requests INTO new_total;
    RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON TABLE public.wordstat_usage TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_wordstat_usage(INTEGER) TO postgres, service_role;
