-- Убирает собственные (не яндексовые) лимиты на проверку спроса через Wordstat —
-- часовой/дневной потолок и счётчик трат были нужны только админ-панели, которую
-- убрали (см. admin/index.html, вкладка «Спрос»). Сама проверка спроса (Edge Function
-- supabase/functions/wordstat) остаётся и будет использоваться дальше — лимитов на неё
-- больше нет, кроме собственной паузы между запросами (DELAY_MS) под реальную квоту Яндекса.
DROP FUNCTION IF EXISTS public.increment_wordstat_usage(INTEGER);
DROP FUNCTION IF EXISTS public.increment_wordstat_usage_hourly(INTEGER);
DROP TABLE IF EXISTS public.wordstat_usage;
DROP TABLE IF EXISTS public.wordstat_usage_hourly;
