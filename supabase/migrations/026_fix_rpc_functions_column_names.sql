-- Migration 026: Fix RPC Functions to Use New Column Names
-- Purpose: Update get_monthly_savings_chart and get_rolling_weekly_savings to use workflow_id and SIMPLE formula
-- User requirement: Fix dashboard broken by column rename (n8n_workflow_id → workflow_id)
-- Created: 2026-02-05

-- ============================================================================
-- 1. Fix get_monthly_savings_chart function
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_monthly_savings_chart(INTEGER, INTEGER, UUID) CASCADE;

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
    -- Get executions for the period with ROI calculated using SIMPLE formula
    SELECT
      er.created_at,
      a.manual_time_per_execution_seconds,
      a.hourly_rate
    FROM public.executions_raw er
    JOIN public.automations a ON a.workflow_id = er.workflow_id  -- FIXED: was n8n_workflow_id
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

    -- SIMPLE FORMULA: Sum saving = (count * manual_time / 3600) * hourly_rate
    COALESCE(
      SUM(
        (COALESCE(ed.manual_time_per_execution_seconds, 300) / 3600.0) * ed.hourly_rate
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
'Returns weekly aggregated savings for a specific month/year using SIMPLE formula. Used by Dashboard ChartCard.';

-- ============================================================================
-- 2. Fix get_rolling_weekly_savings function
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_rolling_weekly_savings(INTEGER, UUID) CASCADE;

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
    -- Get executions for the rolling period with ROI calculated using SIMPLE formula
    SELECT
      er.created_at,
      a.manual_time_per_execution_seconds,
      a.hourly_rate
    FROM public.executions_raw er
    JOIN public.automations a ON a.workflow_id = er.workflow_id  -- FIXED: was n8n_workflow_id
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

    -- SIMPLE FORMULA: Sum saving = (count * manual_time / 3600) * hourly_rate
    COALESCE(
      SUM(
        (COALESCE(ed.manual_time_per_execution_seconds, 300) / 3600.0) * ed.hourly_rate
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
'Returns rolling weekly aggregated savings for the last N weeks from today using SIMPLE formula. Used by Dashboard ChartCard.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Test get_monthly_savings_chart function:
-- SELECT * FROM get_monthly_savings_chart(2026, 2) LIMIT 5;
--
-- 2. Test get_rolling_weekly_savings function:
-- SELECT * FROM get_rolling_weekly_savings(5) LIMIT 5;
--
-- 3. Check for errors in app logs - should no longer see:
-- "column a.n8n_workflow_id does not exist"
