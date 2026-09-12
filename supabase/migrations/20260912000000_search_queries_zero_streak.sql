-- Фикс: results_count раньше слепо перезаписывался КАЖДЫМ новым поиском
-- (results_count = EXCLUDED.results_count) — один неудачный запрос (сетевой
-- сбой при загрузке logos.json/emoji.json, устаревший кэш вкладки, поиск ещё
-- до того как товар добавили в каталог) навсегда замораживал «Найдено: 0» в
-- админке, даже если сайт реально находит этот запрос при каждой следующей
-- попытке — обновить значение было некому, человек с пустой выдачей обычно
-- не повторяет тот же запрос ещё раз.
--
-- Новая логика: результат > 0 обновляется немедленно (как и раньше — сайт
-- явно умеет находить). Результат = 0 засчитывается в отображаемый
-- results_count только после ZERO_STREAK_THRESHOLD подряд идущих пустых
-- поисков — единичный сбой больше не топит метрику.
ALTER TABLE public.search_queries
  ADD COLUMN IF NOT EXISTS zero_streak INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_search_query(p_query TEXT, p_results_count INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ZERO_STREAK_THRESHOLD CONSTANT INTEGER := 3;
BEGIN
  INSERT INTO public.search_queries (query, count, results_count, zero_streak, last_seen)
  VALUES (
    p_query,
    1,
    p_results_count,
    CASE WHEN p_results_count > 0 THEN 0 ELSE 1 END,
    now()
  )
  ON CONFLICT (query) DO UPDATE
    SET count = public.search_queries.count + 1,
        zero_streak = CASE
          WHEN p_results_count > 0 THEN 0
          ELSE public.search_queries.zero_streak + 1
        END,
        results_count = CASE
          WHEN p_results_count > 0 THEN p_results_count
          WHEN public.search_queries.zero_streak + 1 >= ZERO_STREAK_THRESHOLD THEN 0
          ELSE public.search_queries.results_count -- один пустой поиск подряд — старое (найденное) значение не трогаем
        END,
        last_seen = now();
END;
$$;

-- merge_search_queries переносит zero_streak тем же принципом, что и
-- results_count (GREATEST — «предпочитаем найденное»): LEAST для zero_streak
-- значит «предпочитаем менее уверенную пустую серию», т.е. не считаем запрос
-- сломанным, если хотя бы одна из объединяемых строк недавно что-то находила.
CREATE OR REPLACE FUNCTION public.merge_search_queries(p_from TEXT, p_into TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  from_count BIGINT;
  from_results INTEGER;
  from_zero_streak INTEGER;
  from_last TIMESTAMPTZ;
BEGIN
  IF p_from IS NULL OR p_into IS NULL OR p_from = p_into THEN
    RETURN;
  END IF;

  SELECT count, results_count, zero_streak, last_seen
    INTO from_count, from_results, from_zero_streak, from_last
  FROM public.search_queries WHERE query = p_from;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO public.search_queries (query, count, results_count, zero_streak, last_seen)
  VALUES (p_into, from_count, from_results, from_zero_streak, from_last)
  ON CONFLICT (query) DO UPDATE
    SET count = public.search_queries.count + EXCLUDED.count,
        results_count = GREATEST(public.search_queries.results_count, EXCLUDED.results_count),
        zero_streak = LEAST(public.search_queries.zero_streak, EXCLUDED.zero_streak),
        last_seen = GREATEST(public.search_queries.last_seen, EXCLUDED.last_seen);

  DELETE FROM public.search_queries WHERE query = p_from;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_search_query(TEXT, INTEGER) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.merge_search_queries(TEXT, TEXT) TO postgres, service_role;
