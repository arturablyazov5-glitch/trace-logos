-- Объединение двух строк search_queries в одну (напр. "parf" + "parfum" — одно и то же слово).
-- Переносит count/results_count/last_seen из p_from в p_into и удаляет p_from.
CREATE OR REPLACE FUNCTION public.merge_search_queries(p_from TEXT, p_into TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  from_count BIGINT;
  from_results INTEGER;
  from_last TIMESTAMPTZ;
BEGIN
  IF p_from IS NULL OR p_into IS NULL OR p_from = p_into THEN
    RETURN;
  END IF;

  SELECT count, results_count, last_seen INTO from_count, from_results, from_last
  FROM public.search_queries WHERE query = p_from;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  INSERT INTO public.search_queries (query, count, results_count, last_seen)
  VALUES (p_into, from_count, from_results, from_last)
  ON CONFLICT (query) DO UPDATE
    SET count = public.search_queries.count + EXCLUDED.count,
        results_count = GREATEST(public.search_queries.results_count, EXCLUDED.results_count),
        last_seen = GREATEST(public.search_queries.last_seen, EXCLUDED.last_seen);

  DELETE FROM public.search_queries WHERE query = p_from;
END;
$$;

GRANT EXECUTE ON FUNCTION public.merge_search_queries(TEXT, TEXT) TO postgres, service_role;
