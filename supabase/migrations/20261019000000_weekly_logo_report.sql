-- Independent weekly aggregates: never infer a week's activity from lifetime totals.
create table public.weekly_logo_metrics (
  week date not null, kind text not null check (kind in ('view','download','miss')),
  key text not null, count bigint not null default 0,
  primary key (week,kind,key)
);
alter table public.weekly_logo_metrics enable row level security;
revoke all on public.weekly_logo_metrics from anon, authenticated;
grant all on public.weekly_logo_metrics to service_role;
create table public.weekly_report_state (
  id boolean primary key default true check(id), started_at timestamptz not null default now()
);
insert into public.weekly_report_state default values;
alter table public.weekly_report_state enable row level security;
create table public.weekly_report_deliveries (
  week date primary key, status text not null default 'sending',
  message_id bigint, created_at timestamptz not null default now()
);
alter table public.weekly_report_deliveries enable row level security;
grant all on public.weekly_report_deliveries to service_role;

create function public.collect_weekly_logo_metric() returns trigger
language plpgsql security definer set search_path=public as $$
declare k text; metric text; delta bigint; w date;
begin
  w := date_trunc('week', now() at time zone 'Europe/Moscow')::date;
  if TG_TABLE_NAME='logo_stats' then
    if NEW.figma not like 'Icon/%' then return NEW; end if;
    k := NEW.figma; metric := 'view';
    delta := NEW.views - case when TG_OP='INSERT' then 0 else OLD.views end;
  elsif TG_TABLE_NAME='export_stats' then
    if NEW.figma not like 'Icon/%' or NEW.format not in ('svg','png','webp','pdf','ai','eps','ico','icns','zip','jpg','jpeg') then return NEW; end if;
    k := NEW.figma; metric := 'download';
    delta := NEW.count - case when TG_OP='INSERT' then 0 else OLD.count end;
  else
    return NEW;
  end if;
  if delta > 0 then
    insert into public.weekly_logo_metrics(week,kind,key,count) values(w,metric,k,delta)
    on conflict(week,kind,key) do update set count=weekly_logo_metrics.count+excluded.count;
  end if;
  return NEW;
end $$;
create trigger weekly_logo_views after insert or update on public.logo_stats
for each row execute function public.collect_weekly_logo_metric();
create trigger weekly_logo_downloads after insert or update on public.export_stats
for each row execute function public.collect_weekly_logo_metric();

create function public.get_weekly_logo_report() returns jsonb
language sql security definer set search_path=public as $$
with period as (
 select date_trunc('week', now() at time zone 'Europe/Moscow')::date - 7 as week
), metrics as (
 select m.* from weekly_logo_metrics m, period p where m.week=p.week
)
select jsonb_build_object(
 'week',p.week,'end',p.week+7,
 'started_at',(select started_at from weekly_report_state),
 'complete',(select started_at <= p.week::timestamp at time zone 'Europe/Moscow' from weekly_report_state),
 'views',coalesce((select sum(count) from metrics where kind='view'),0),
 'downloads',coalesce((select sum(count) from metrics where kind='download'),0),
 'top', (select jsonb_build_object('figma',m.key,'name',coalesce(nullif(s.name,''),m.key),'count',m.count)
   from metrics m left join logo_stats s on s.figma=m.key where m.kind='download' order by m.count desc,m.key limit 1),
 'misses',coalesce((select jsonb_agg(t) from (select key as query,count from metrics where kind='miss' order by count desc,key limit 3)t),'[]'::jsonb)
) from period p;
$$;
revoke all on function public.get_weekly_logo_report() from public,anon,authenticated;
grant execute on function public.get_weekly_logo_report() to service_role;

CREATE OR REPLACE FUNCTION public.increment_search_query(p_query TEXT, p_results_count INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ZERO_STREAK_THRESHOLD CONSTANT INTEGER := 3;
BEGIN
  -- Record raw misses at the event boundary; admin merges must not create activity.
  IF p_results_count = 0 THEN
    INSERT INTO public.weekly_logo_metrics(week,kind,key,count)
    VALUES(date_trunc('week',now() at time zone 'Europe/Moscow')::date,'miss',lower(trim(p_query)),1)
    ON CONFLICT(week,kind,key) DO UPDATE SET count=weekly_logo_metrics.count+1;
  END IF;
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
