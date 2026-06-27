-- Популярность логотипов: один счётчик-агрегат на логотип.
-- База НЕ растёт по числу просмотров — только по числу уникальных логотипов
-- (≈455 строк навсегда). Инкремент атомарный через upsert.

create table if not exists public.logo_stats (
  figma      text primary key,           -- ключ логотипа (item.figma), напр. "Icon/Bank/Sberbank"
  name       text not null default '',    -- человекочитаемое имя для админки
  img        text not null default '',    -- абсолютный URL картинки для превью в админке
  views      bigint not null default 0,   -- суммарно: открытия в каталоге + заходы на SEO-страницу
  updated_at timestamptz not null default now()
);

-- RLS включён без политик → ни anon, ни authenticated не читают/пишут напрямую.
-- Доступ только у service_role (его использует Edge Function track). Так статистику
-- нельзя выкачать публичным anon-ключом.
alter table public.logo_stats enable row level security;

-- Атомарный инкремент. SECURITY DEFINER, чтобы выполнялось с правами владельца.
create or replace function public.increment_logo_view(
  p_figma text,
  p_name  text default '',
  p_img   text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_figma is null or length(trim(p_figma)) = 0 then
    return;
  end if;

  insert into public.logo_stats (figma, name, img, views, updated_at)
  values (p_figma, coalesce(p_name, ''), coalesce(p_img, ''), 1, now())
  on conflict (figma) do update
    set views      = public.logo_stats.views + 1,
        -- имя/картинку обновляем только если пришли непустыми (не затираем)
        name       = case when coalesce(excluded.name, '') <> '' then excluded.name else public.logo_stats.name end,
        img        = case when coalesce(excluded.img, '')  <> '' then excluded.img  else public.logo_stats.img  end,
        updated_at = now();
end;
$$;

-- Полный сброс статистики (вызывается из админки через Edge Function track DELETE).
create or replace function public.reset_logo_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate public.logo_stats;
end;
$$;
