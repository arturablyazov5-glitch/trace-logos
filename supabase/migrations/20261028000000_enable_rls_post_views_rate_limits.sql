-- Supabase Security Advisor: rls_disabled_in_public для post_views и rate_limits.
-- Обе таблицы читают и пишут только Edge Functions (track, _shared/rate-limit) с service_role,
-- а инкремент идёт через SECURITY DEFINER-функции, поэтому политики для anon/authenticated не нужны:
-- RLS без политик закрывает им доступ целиком, service_role и владелец RLS обходят.
ALTER TABLE public.post_views   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits  ENABLE ROW LEVEL SECURITY;

-- Anon не должен иметь прав на эти таблицы даже формально (раньше были выданы по умолчанию).
REVOKE ALL ON TABLE public.post_views  FROM anon, authenticated;
REVOKE ALL ON TABLE public.rate_limits FROM anon, authenticated;
