-- Добавляем поддержку вариантов в статистику экспорта.
-- Если таблица уже существует без колонки variant, добавляем её.
-- Если таблицы нет, создаём с нуля.

do $$
begin
    if not exists (select from pg_tables where schemaname = 'public' and tablename = 'export_stats') then
        create table public.export_stats (
            figma   text not null,
            format  text not null,
            variant text not null default '',
            count   bigint not null default 0,
            primary key (figma, format, variant)
        );
        alter table public.export_stats enable row level security;
    else
        if not exists (select from information_schema.columns where table_schema = 'public' and table_name = 'export_stats' and column_name = 'variant') then
            -- Удаляем старый PK и создаем новый с учетом варианта
            alter table public.export_stats drop constraint if exists export_stats_pkey;
            alter table public.export_stats add column variant text not null default '';
            alter table public.export_stats add primary key (figma, format, variant);
        end if;
    end if;
end $$;

-- Обновляем RPC для инкремента экспорта с поддержкой варианта
create or replace function public.increment_export(
  p_figma   text,
  p_format  text,
  p_variant text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_figma is null or p_format is null then
    return;
  end if;

  insert into public.export_stats (figma, format, variant, count)
  values (p_figma, p_format, coalesce(p_variant, ''), 1)
  on conflict (figma, format, variant) do update
    set count = public.export_stats.count + 1;
end;
$$;

-- Добавляем сброс экспортной статистики в общую функцию сброса
create or replace function public.reset_logo_stats()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  truncate public.logo_stats;
  truncate public.export_stats;
end;
$$;
