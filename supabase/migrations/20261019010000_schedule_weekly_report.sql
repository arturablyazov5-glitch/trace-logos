-- WEEKLY_REPORT_KEY must also be stored in Vault as trace_weekly_report_key.
-- See https://supabase.com/docs/guides/functions/schedule-functions
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.schedule('trace-logos-weekly-report', '0 2 * * 1', $job$
  select net.http_post(
    url := 'https://wezryybxxwicysnbmhkz.supabase.co/functions/v1/weekly-report',
    headers := jsonb_build_object('Content-Type','application/json','x-report-key',
      (select decrypted_secret from vault.decrypted_secrets where name='trace_weekly_report_key')),
    body := '{}'::jsonb, timeout_milliseconds := 30000
  );
$job$);
-- pg_cron uses UTC: 02:00 UTC = Monday 05:00 Europe/Moscow.
