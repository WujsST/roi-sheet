-- Migration 036: fix `extract(epoch from integer)` w calculate_dashboard_stats
--
-- Migracja 028 miała `extract(epoch from (least(p_to, current_date) - greatest(p_from, a.created_at::date)))`.
-- W Postgres `date - date` zwraca integer (liczba dni), nie interval — więc
-- `extract(epoch from integer)` rzuca 42883 ("function pg_catalog.extract(unknown, integer)
-- does not exist") i dashboard "/" wywala 500.
--
-- Fix: użyć różnicy dat wprost (już są to dni) i clamp do >= 0, bez extract().

create or replace function public.calculate_dashboard_stats(
  p_from date,
  p_to date
)
returns table (
  total_savings numeric,
  time_saved_hours integer,
  efficiency_score integer,
  inaction_cost numeric,
  total_executions integer
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total_savings numeric := 0;
  v_total_hours numeric := 0;
  v_total_execs integer := 0;
  v_success_execs integer := 0;
  v_inaction numeric := 0;
begin
  select
    coalesce(sum((a.seconds_saved_per_execution / 3600.0) * a.hourly_rate), 0),
    coalesce(sum(a.seconds_saved_per_execution) / 3600.0, 0),
    count(*) filter (where er.status = 'success')
  into v_total_savings, v_total_hours, v_success_execs
  from public.executions_raw er
  join public.automations a on a.workflow_id = er.workflow_id
  where er.created_at >= p_from
    and er.created_at < p_to + interval '1 day'
    and er.status = 'success';

  select count(*)
  into v_total_execs
  from public.executions_raw er
  join public.automations a on a.workflow_id = er.workflow_id
  where er.created_at >= p_from
    and er.created_at < p_to + interval '1 day';

  -- date - date = integer (days). No extract() needed. Clamp to >= 0.
  select coalesce(sum(
    greatest(
      greatest(0, least(p_to, current_date) - greatest(p_from, a.created_at::date)) * 8
      - (
        select count(*)
        from public.executions_raw er2
        where er2.workflow_id = a.workflow_id
          and er2.created_at >= p_from
          and er2.created_at < p_to + interval '1 day'
          and er2.status = 'success'
      ),
      0
    ) * coalesce(a.hourly_rate, 150)
  ), 0)
  into v_inaction
  from public.automations a
  where a.status != 'paused';

  return query select
    v_total_savings::numeric,
    v_total_hours::integer,
    case
      when v_total_execs > 0
        then ((v_success_execs::float / v_total_execs::float) * 100)::integer
      else 0
    end,
    v_inaction::numeric,
    v_total_execs;
end;
$$;
