-- Migration 016: Add RPC for Monthly Savings Chart
-- Purpose: Calculate weekly savings distribution from real executions (no mocks)

CREATE OR REPLACE FUNCTION public.get_monthly_savings_chart(
  p_year int,
  p_month int,
  p_client_id uuid default null
)
RETURNS TABLE (
  week_label text,
  week_start date,
  executions_count bigint,
  money_saved_pln numeric
)
LANGUAGE sql
STABLE
AS $$
  with month_range as (
    select
      make_date(p_year, p_month, 1) as start_date,
      (make_date(p_year, p_month, 1) + interval '1 month' - interval '1 day')::date as end_date
  )
  select
    'Tydzień ' || dense_rank() over (order by date_trunc('week', er.created_at)::date) as week_label,
    date_trunc('week', er.created_at)::date as week_start,
    count(*) as executions_count,
    sum((a.seconds_saved_per_execution / 3600.0) * a.hourly_rate) as money_saved_pln
  from public.executions_raw er
  join public.automations a
    on a.n8n_workflow_id = er.n8n_workflow_id
  join month_range mr
    on er.created_at::date between mr.start_date and mr.end_date
  where (p_client_id is null or a.client_id = p_client_id)
  group by 2
  order by week_start;
$$;

COMMENT ON FUNCTION public.get_monthly_savings_chart IS
'Returns real weekly accumulated savings for a given month/client based on raw executions.';
