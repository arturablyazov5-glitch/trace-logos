-- Extend the existing weekly payload with cumulative logo counters.
create function public.get_weekly_logo_report_with_totals() returns jsonb
language sql security invoker set search_path = ''
as $$
  select public.get_weekly_logo_report() || jsonb_build_object(
    'total_views', coalesce((
      select sum(views) from public.logo_stats where figma like 'Icon/%'
    ), 0),
    'total_downloads', coalesce((
      select sum(count) from public.export_stats
      where figma like 'Icon/%'
        and format in ('svg','png','webp','pdf','ai','eps','ico','icns','zip','jpg','jpeg')
    ), 0)
  );
$$;

revoke all on function public.get_weekly_logo_report_with_totals() from public, anon, authenticated;
grant execute on function public.get_weekly_logo_report_with_totals() to service_role;
