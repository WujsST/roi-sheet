-- Migration 020: Add Technology Source Field and Fix Hours Calculation
-- Purpose: Track automation source (n8n, zapier, etc) and fix time saved calculation
-- Created: 2026-02-03

-- ============================================================================
-- 1. Add Source/Technology Column to Automations
-- ============================================================================

ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'n8n';

COMMENT ON COLUMN public.automations.source IS
'Automation platform source: n8n, zapier, make, retell, etc.';

-- ============================================================================
-- 2. Fix calculate_dashboard_stats() to properly calculate Hours Saved
-- ============================================================================
-- Issue: automation_time_per_execution_seconds defaults to 30, but we should use
-- actual execution duration from executions_raw (stopped_at - started_at)
-- Formula: SUM(executions * manual_time) / 3600 for net time saved

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
  -- Calculate real time saved: SUM(executions * manual_time_per_execution_seconds)
  -- This represents total manual time that would have been spent
  SELECT COALESCE(SUM(
    e.execution_count * a.manual_time_per_execution_seconds
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
'Returns dashboard metrics. time_saved_hours = SUM(executions * manual_time_per_execution) / 3600';

-- ============================================================================
-- Verification
-- ============================================================================
-- SELECT * FROM calculate_dashboard_stats();
-- SELECT source FROM automations LIMIT 5;
