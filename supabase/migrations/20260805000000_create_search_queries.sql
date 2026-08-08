CREATE TABLE IF NOT EXISTS public.search_queries (
  query TEXT PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  results_count INTEGER NOT NULL DEFAULT 0,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.search_queries TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.increment_search_query(p_query TEXT, p_results_count INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.search_queries (query, count, results_count, last_seen)
  VALUES (p_query, 1, p_results_count, now())
  ON CONFLICT (query) DO UPDATE
    SET count = public.search_queries.count + 1,
        results_count = EXCLUDED.results_count,
        last_seen = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_search_query(TEXT, INTEGER) TO postgres, service_role;

CREATE OR REPLACE FUNCTION public.reset_search_queries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.search_queries;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_search_queries() TO postgres, service_role;
