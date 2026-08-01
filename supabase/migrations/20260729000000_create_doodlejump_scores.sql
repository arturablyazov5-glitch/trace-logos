-- Глобальный лидерборд пасхалки Doodle Jump (assets/easter-egg/doodlejump/).
-- Один ряд на игрока (по имени) — хранится только его лучший результат,
-- таблица не растёт по числу забегов. Тот же паттерн, что у logo_stats.

create table if not exists public.doodlejump_scores (
  name       text primary key,           -- имя игрока (введено в игре, "unnamed" по умолчанию)
  score      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- RLS включён без политик → ни anon, ни authenticated не читают/пишут напрямую.
-- Доступ только у service_role (его использует Edge Function doodlejump-scores).
alter table public.doodlejump_scores enable row level security;

-- Апсерт лучшего результата: обновляет только если новый счёт выше сохранённого.
create or replace function public.submit_doodlejump_score(
  p_name  text,
  p_score bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_name is null or length(trim(p_name)) = 0 or p_score is null or p_score <= 0 then
    return;
  end if;

  insert into public.doodlejump_scores (name, score, updated_at)
  values (trim(p_name), p_score, now())
  on conflict (name) do update
    set score      = greatest(public.doodlejump_scores.score, excluded.score),
        updated_at = case when excluded.score > public.doodlejump_scores.score then now() else public.doodlejump_scores.updated_at end;
end;
$$;

grant all on table public.doodlejump_scores to postgres, service_role;
grant execute on function public.submit_doodlejump_score(text, bigint) to postgres, service_role;
