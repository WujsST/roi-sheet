-- Migration 017: Add Rolling Weekly Savings Function
-- Purpose: Create RPC function for dynamic rolling 5-week savings chart
-- Created: 2026-02-02

-- ============================================================================
-- 1. Create get_rolling_weekly_savings RPC function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_rolling_weekly_savings(
  p_weeks_back INTEGER DEFAULT 5,
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE (
  week_label TEXT,
  week_start DATE,
  executions_count BIGINT,
  money_saved_pln NUMERIC
) AS $$
DECLARE
  v_end_date DATE;
  v_start_date DATE;
BEGIN
  -- End date is today
  v_end_date := CURRENT_DATE;

  -- Start date is p_weeks_back weeks ago
  v_start_date := v_end_date - (p_weeks_back * 7);

  RETURN QUERY
  WITH weekly_buckets AS (
    -- Generate weekly buckets going back from today
    SELECT
      generate_series(
        DATE_TRUNC('week', v_start_date)::DATE,
        DATE_TRUNC('week', v_end_date)::DATE,
        '1 week'
      )::DATE as week_start
  ),
  executions_data AS (
    -- Get executions for the rolling period with ROI calculated
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
    -- Format: "Tydzień 1 (DD.MM-DD.MM)"
    'Tydzień ' || ROW_NUMBER() OVER (ORDER BY wb.week_start)::TEXT || ' (' ||
    TO_CHAR(wb.week_start, 'DD.MM') || '-' ||
    TO_CHAR(wb.week_start + 6, 'DD.MM') || ')' as week_label,

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
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_rolling_weekly_savings IS
'Returns rolling weekly aggregated savings for the last N weeks from today. Used by Dashboard ChartCard for dynamic data display.';
