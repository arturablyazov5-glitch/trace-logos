-- Общий rate-limiter для публичных Edge Functions (suggest, upload, track).
-- Один bucket на "эндпоинт:IP", скользящее окно p_window_seconds; вызывающая функция
-- сравнивает возвращённый count с своим лимитом и решает, отдавать 429 или нет.
CREATE TABLE IF NOT EXISTS public.rate_limits (
    bucket_key   TEXT PRIMARY KEY,
    count        INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Атомарно инкрементит счётчик бакета; если текущее окно истекло — сбрасывает его в 1.
-- Заодно с шансом 5% подчищает протухшие бакеты старше суток, чтобы таблица не росла бесконечно
-- (отдельный cron для этого не заводим — cleanup хватает, т.к. трафик формы небольшой).
CREATE OR REPLACE FUNCTION public.increment_rate_limit(p_bucket_key TEXT, p_window_seconds INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    IF random() < 0.05 THEN
        DELETE FROM public.rate_limits WHERE window_start < now() - INTERVAL '1 day';
    END IF;

    INSERT INTO public.rate_limits (bucket_key, count, window_start)
    VALUES (p_bucket_key, 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
        count = CASE
            WHEN public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            THEN 1
            ELSE public.rate_limits.count + 1
        END,
        window_start = CASE
            WHEN public.rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval
            THEN now()
            ELSE public.rate_limits.window_start
        END
    RETURNING count INTO new_count;

    RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON TABLE public.rate_limits TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, INTEGER) TO postgres, service_role;
