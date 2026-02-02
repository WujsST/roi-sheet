-- Migration 019: Add Time Tracking Fields to Automations
-- Purpose: Enable accurate "Hours Back" calculation based on actual time savings per execution
-- Created: 2026-02-02

-- ============================================================================
-- 1. Add Time Tracking Columns to Automations
-- ============================================================================

ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS manual_time_per_execution_seconds INTEGER DEFAULT 300;

ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS automation_time_per_execution_seconds INTEGER DEFAULT 30;

COMMENT ON COLUMN public.automations.manual_time_per_execution_seconds IS
'Time in seconds that a manual execution of this task would take (default 5 min)';

COMMENT ON COLUMN public.automations.automation_time_per_execution_seconds IS
'Time in seconds that the automated execution actually takes (default 30 sec)';

-- ============================================================================
-- 2. Update calculate_dashboard_stats() to Compute Real Hours Saved
-- ============================================================================
-- New formula: SUM(success_executions * (manual_time - automation_time)) / 3600

DROP FUNCTION IF EXISTS public.calculate_dashboard_stats();

CREATE OR REPLACE FUNCTION public.calculate_dashboard_stats()
RETURNS TABLE(
  total_savings DECIMAL,
  time_saved_hours INTEGER,
  efficiency_score INTEGER,
  inaction_cost DECIMAL,
  total_savings_all_time DECIMAL
) AS $$
DECLARE
  v_time_saved_seconds BIGINT;
BEGIN
  -- Calculate real time saved from executions
  SELECT COALESCE(SUM(
    e.execution_count * (a.manual_time_per_execution_seconds - a.automation_time_per_execution_seconds)
  ), 0)
  INTO v_time_saved_seconds
  FROM (
    SELECT
      n8n_workflow_id,
      COUNT(*) as execution_count
    FROM public.executions_raw
    WHERE status = 'success'
      AND created_at >= date_trunc('month', CURRENT_DATE)
    GROUP BY n8n_workflow_id
  ) e
  JOIN public.automations a ON a.n8n_workflow_id = e.n8n_workflow_id;

  RETURN QUERY
  SELECT
    (SELECT get_monthly_total_savings.total_savings FROM get_monthly_total_savings() LIMIT 1),
    (v_time_saved_seconds / 3600)::INTEGER,
    (SELECT get_monthly_efficiency.efficiency_score FROM get_monthly_efficiency() LIMIT 1),
    (SELECT get_inaction_cost.inaction_cost FROM get_inaction_cost() LIMIT 1),
    (SELECT get_lifetime_total_savings() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.calculate_dashboard_stats IS
'Returns dashboard metrics with accurate time_saved_hours calculated from execution counts and configured time savings per automation.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- Test: Check new columns exist
-- SELECT id, name, manual_time_per_execution_seconds, automation_time_per_execution_seconds FROM automations LIMIT 5;

-- Test: Verify calculation
-- SELECT * FROM calculate_dashboard_stats();
