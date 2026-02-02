-- Migration 016: Add Monthly Savings Chart Function
-- Purpose: Add RPC function for weekly aggregated savings chart
-- Created: 2026-02-02

-- ============================================================================
-- 1. Create get_monthly_savings_chart RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_monthly_savings_chart(
  p_year INTEGER,
  p_month INTEGER,
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE (
  week_label TEXT,
  week_start DATE,
  executions_count BIGINT,
  money_saved_pln NUMERIC
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  -- Set start date to first day of requested month
  v_start_date := MAKE_DATE(p_year, p_month, 1);
  -- Set end date to last day of requested month
  v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  RETURN QUERY
  WITH weekly_buckets AS (
    -- Generate weekly buckets for the month
    SELECT
      generate_series(
        DATE_TRUNC('week', v_start_date)::DATE,
        DATE_TRUNC('week', v_end_date)::DATE,
        '1 week'
      )::DATE as week_start
  ),
  executions_data AS (
    -- Get executions for the period with ROI calculated
    SELECT
      er.created_at,
      a.seconds_saved_per_execution,
      a.hourly_rate
    FROM public.executions_raw er
    JOIN public.automations a ON a.n8n_workflow_id = er.n8n_workflow_id
    WHERE er.created_at >= v_start_date
      AND er.created_at <= v_end_date + INTERVAL '1 day' -- Include full last day
      AND (p_client_id IS NULL OR a.client_id = p_client_id)
      AND er.status = 'success'
  )
  SELECT
    -- Format: "Week 1 (Feb 1-7)"
    'Tydzień ' || ROW_NUMBER() OVER (ORDER BY wb.week_start)::TEXT || ' (' ||
    TO_CHAR(GREATEST(wb.week_start, v_start_date), 'DD.MM') || '-' ||
    TO_CHAR(LEAST(wb.week_start + 6, v_end_date), 'DD.MM') || ')' as week_label,

    wb.week_start,

    -- Count executions in this week
    COUNT(ed.created_at) as executions_count,

    -- Sum saving: (count * seconds_saved / 3600) * hourly_rate
    COALESCE(
      SUM(
        (ed.seconds_saved_per_execution / 3600.0) * ed.hourly_rate
      ),
      0
    )::NUMERIC(10, 2) as money_saved_pln

  FROM weekly_buckets wb
  LEFT JOIN executions_data ed ON DATE_TRUNC('week', ed.created_at)::DATE = wb.week_start
  GROUP BY wb.week_start
  ORDER BY wb.week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_monthly_savings_chart IS
'Returns weekly aggregated savings for a specific month/year. Used by Dashboard ChartCard.';
