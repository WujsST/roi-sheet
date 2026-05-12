-- Migration 028: Security-invoker views + ranged RPCs + drop deprecated workflow_executions
-- Purpose:
--   1. Views (automations_dashboard, clients_dashboard, monthly_automations_stats,
--      monthly_savings_history) defaulted to SECURITY DEFINER, bypassing RLS.
--      That's why "every account sees all data" — multi-tenant leak.
--   2. get_monthly_savings_chart was SECURITY DEFINER (also bypassed RLS) and
--      hardcoded p_year/p_month. Replace with INVOKER + p_from/p_to range.
--   3. get_rolling_weekly_savings hardcoded "weeks back from today". Replace
--      with INVOKER + p_from/p_to range so dashboard can show > 3 weeks.
--   4. Drop workflow_executions (deprecated by migration 015, never populated).

-- ============================================================================
-- 1. Drop deprecated workflow_executions (and dependent objects)
-- ============================================================================

drop view if exists public.v_automation_daily_stats cascade;
drop view if exists public.v_monthly_savings cascade;
drop view if exists public.v_client_roi_metrics cascade;
drop table if exists public.workflow_executions cascade;

-- ============================================================================
-- 2. Recreate views with security_invoker = true so RLS is enforced
-- ============================================================================

drop view if exists public.monthly_savings_history cascade;
drop view if exists public.clients_dashboard cascade;
drop view if exists public.monthly_automations_stats cascade;
drop view if exists public.automations_dashboard cascade;

create view public.automations_dashboard
with (security_invoker = true) as
select
  a.id,
  a.name,
  a.client_id,
  a.user_id,
  coalesce(c.name, 'Brak klienta') as client_name,
  a.workflow_id,
  a.icon,
  a.status,
  a.hourly_rate,
  a.seconds_saved_per_execution,
  a.monthly_cost_pln,
  coalesce(a.initial_investment_pln, 0) as initial_investment_pln,
  a.created_at,

  -- Months elapsed since creation (used for total_cost and breakeven)
  greatest(
    extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
    0
  ) as months_elapsed,

  -- Execution metrics
  count(er.id) as executions_count,
  (count(er.id) * a.seconds_saved_per_execution) as saved_seconds,
  (count(er.id) * a.seconds_saved_per_execution) / 3600.0 as saved_hours,
  ((count(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate as money_saved_pln,

  -- Total cost = initial + cumulative monthly
  (
    coalesce(a.initial_investment_pln, 0)
    + a.monthly_cost_pln * greatest(
        extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
        0
      )
  ) as total_cost_pln,

  -- ROI percentage = (savings - total_cost) / total_cost * 100
  case
    when (
      coalesce(a.initial_investment_pln, 0)
      + a.monthly_cost_pln * greatest(
          extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
          0
        )
    ) > 0
    then (
      ((count(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate
      - (
        coalesce(a.initial_investment_pln, 0)
        + a.monthly_cost_pln * greatest(
            extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
            0
          )
      )
    ) / nullif(
      coalesce(a.initial_investment_pln, 0)
      + a.monthly_cost_pln * greatest(
          extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
          0
        ),
      0
    ) * 100
    else null
  end as roi_percentage,

  -- Breakeven months: total_cost / monthly_savings_rate
  case
    when count(er.id) > 0 and a.monthly_cost_pln > 0
    then (
      coalesce(a.initial_investment_pln, 0)
      / nullif(
          ((count(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate
          / nullif(
              greatest(
                extract(epoch from (now() - a.created_at)) / (60 * 60 * 24 * 30.0),
                0.0001
              ),
              0
          )
          - a.monthly_cost_pln,
          0
      )
    )
    else null
  end as breakeven_months,

  max(er.created_at) as last_run_at,

  coalesce(
    (
      select ((count(er2.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate
      from public.executions_raw er2
      where er2.workflow_id = a.workflow_id
        and date(er2.created_at) = current_date
    ),
    0
  ) as saved_today

from public.automations a
left join public.clients c on c.id = a.client_id
left join public.executions_raw er on er.workflow_id = a.workflow_id
group by
  a.id, a.name, a.client_id, a.user_id, c.name, a.workflow_id, a.icon, a.status,
  a.hourly_rate, a.seconds_saved_per_execution, a.monthly_cost_pln,
  a.initial_investment_pln, a.created_at;

comment on view public.automations_dashboard is
  'Automations + ROI metrics from executions_raw. RLS-respecting (security_invoker).';

create view public.monthly_automations_stats
with (security_invoker = true) as
select
  a.id as automation_id,
  a.name,
  a.client_id,
  a.user_id,
  date_trunc('month', er.created_at) as month,
  count(er.id) as executions_count,
  (count(er.id) * a.seconds_saved_per_execution) / 3600.0 as saved_hours,
  ((count(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate as money_saved_pln
from public.automations a
left join public.executions_raw er on er.workflow_id = a.workflow_id
group by a.id, a.name, a.client_id, a.user_id, date_trunc('month', er.created_at);

comment on view public.monthly_automations_stats is
  'Per-automation monthly metrics. RLS-respecting (security_invoker).';

create view public.clients_dashboard
with (security_invoker = true) as
select
  c.id as client_id,
  c.name as client_name,
  c.user_id,
  count(distinct a.id) as automations_count,
  coalesce(sum(stats.executions_count), 0) as executions_count,
  coalesce(sum(stats.money_saved_pln), 0) as money_saved_pln_total,
  coalesce(sum(stats.saved_hours), 0) as saved_hours_total
from public.clients c
left join public.automations a on a.client_id = c.id
left join public.monthly_automations_stats stats on stats.automation_id = a.id
group by c.id, c.name, c.user_id;

comment on view public.clients_dashboard is
  'Per-client aggregated metrics. RLS-respecting (security_invoker).';

create view public.monthly_savings_history
with (security_invoker = true) as
select
  to_char(month, 'Mon') as month_abbr,
  month::date as month_date,
  sum(money_saved_pln) as total_saved
from public.monthly_automations_stats
where month is not null
group by month
order by month;

comment on view public.monthly_savings_history is
  'Monthly savings totals. RLS-respecting (security_invoker).';

-- ============================================================================
-- 3. Replace get_monthly_savings_chart with ranged + INVOKER variant
-- ============================================================================

drop function if exists public.get_monthly_savings_chart(integer, integer, uuid);
drop function if exists public.get_monthly_savings_chart(integer, integer);
drop function if exists public.get_monthly_savings_chart(date, date, uuid);

create or replace function public.get_monthly_savings_chart(
  p_from date,
  p_to date,
  p_client_id uuid default null
)
returns table (
  week_label text,
  week_start date,
  executions_count bigint,
  money_saved_pln numeric
)
language plpgsql
security invoker  -- respect caller's RLS
set search_path = public
as $$
begin
  return query
  with weekly_buckets as (
    select
      generate_series(
        date_trunc('week', p_from)::date,
        date_trunc('week', p_to)::date,
        '1 week'
      )::date as bucket_start
  ),
  executions_data as (
    select
      er.created_at,
      a.seconds_saved_per_execution,
      a.hourly_rate,
      a.client_id
    from public.executions_raw er
    join public.automations a on a.workflow_id = er.workflow_id
    where er.created_at >= p_from
      and er.created_at < p_to + interval '1 day'
      and (p_client_id is null or a.client_id = p_client_id)
      and er.status = 'success'
  )
  select
    'Tydzień ' || row_number() over (order by wb.bucket_start)::text || ' (' ||
      to_char(greatest(wb.bucket_start, p_from), 'DD.MM') || '-' ||
      to_char(least(wb.bucket_start + 6, p_to), 'DD.MM') || ')' as week_label,
    wb.bucket_start as week_start,
    count(ed.created_at) as executions_count,
    coalesce(
      sum((ed.seconds_saved_per_execution / 3600.0) * ed.hourly_rate),
      0
    )::numeric(10, 2) as money_saved_pln
  from weekly_buckets wb
  left join executions_data ed
    on date_trunc('week', ed.created_at)::date = wb.bucket_start
  group by wb.bucket_start
  order by wb.bucket_start;
end;
$$;

comment on function public.get_monthly_savings_chart(date, date, uuid) is
  'Weekly aggregated savings for an arbitrary date range. RLS-respecting (security_invoker).';

-- ============================================================================
-- 4. Replace get_rolling_weekly_savings with ranged variant
-- ============================================================================

drop function if exists public.get_rolling_weekly_savings(integer, uuid);
drop function if exists public.get_rolling_weekly_savings(integer);

create or replace function public.get_rolling_weekly_savings(
  p_from date,
  p_to date,
  p_client_id uuid default null
)
returns table (
  week_label text,
  week_start date,
  executions_count bigint,
  money_saved_pln numeric
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  return query
  with weekly_buckets as (
    select
      generate_series(
        date_trunc('week', p_from)::date,
        date_trunc('week', p_to)::date,
        '1 week'
      )::date as bucket_start
  ),
  executions_data as (
    select
      er.created_at,
      a.seconds_saved_per_execution,
      a.hourly_rate,
      a.client_id
    from public.executions_raw er
    join public.automations a on a.workflow_id = er.workflow_id
    where er.created_at >= p_from
      and er.created_at < p_to + interval '1 day'
      and (p_client_id is null or a.client_id = p_client_id)
      and er.status = 'success'
  )
  select
    'Tydzień ' || row_number() over (order by wb.bucket_start)::text || ' (' ||
      to_char(wb.bucket_start, 'DD.MM') || '-' ||
      to_char(wb.bucket_start + 6, 'DD.MM') || ')' as week_label,
    wb.bucket_start as week_start,
    count(ed.created_at) as executions_count,
    coalesce(
      sum((ed.seconds_saved_per_execution / 3600.0) * ed.hourly_rate),
      0
    )::numeric(10, 2) as money_saved_pln
  from weekly_buckets wb
  left join executions_data ed
    on date_trunc('week', ed.created_at)::date = wb.bucket_start
  group by wb.bucket_start
  order by wb.bucket_start;
end;
$$;

comment on function public.get_rolling_weekly_savings(date, date, uuid) is
  'Weekly aggregated savings for an arbitrary date range (alias for get_monthly_savings_chart).';

-- ============================================================================
-- 5. Replace calculate_dashboard_stats with ranged variant
-- ============================================================================

drop function if exists public.get_monthly_total_savings();
drop function if exists public.get_monthly_time_saved();
drop function if exists public.get_monthly_efficiency();
drop function if exists public.get_inaction_cost();
drop function if exists public.calculate_dashboard_stats();
drop function if exists public.calculate_dashboard_stats(date, date);

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
  -- Aggregate over successful executions in range, joined on automations (RLS filters
  -- both tables to caller's user_id automatically because we run as security invoker).
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

  -- Total executions across all statuses for efficiency rate
  select count(*)
  into v_total_execs
  from public.executions_raw er
  join public.automations a on a.workflow_id = er.workflow_id
  where er.created_at >= p_from
    and er.created_at < p_to + interval '1 day';

  -- Inaction cost: potential runs minus actual, multiplied by hourly rate.
  -- Heuristic: 8 expected runs per day for each non-paused automation in range.
  select coalesce(sum(
    greatest(
      (extract(epoch from (least(p_to, current_date) - greatest(p_from, a.created_at::date))) / 86400.0)::int * 8
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

comment on function public.calculate_dashboard_stats(date, date) is
  'Dashboard KPI stats for an arbitrary date range. RLS-respecting (security_invoker).';
