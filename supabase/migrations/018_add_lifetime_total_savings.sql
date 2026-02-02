-- Migration 018: Add Lifetime Total Savings Function
-- Purpose: Calculate ALL-TIME cumulative savings across all executions (not just current month)
-- Created: 2026-02-02

-- ============================================================================
-- 1. Create get_lifetime_total_savings() Function
-- ============================================================================
-- Returns total savings from ALL executions across ALL time periods
-- No date filtering - sums entire automations_dashboard view

CREATE OR REPLACE FUNCTION public.get_lifetime_total_savings()
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(money_saved_pln)
     FROM public.automations_dashboard),
    0
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_lifetime_total_savings IS
'Returns lifetime cumulative savings from ALL executions (all time periods). Used for left Oszczędności widget on dashboard.';

-- ============================================================================
-- 2. Update calculate_dashboard_stats() to Include Lifetime Total
-- ============================================================================
-- Add total_savings_all_time field to return value

DROP FUNCTION IF EXISTS public.calculate_dashboard_stats();

CREATE OR REPLACE FUNCTION public.calculate_dashboard_stats()
RETURNS TABLE(
  total_savings DECIMAL,
  time_saved_hours INTEGER,
  efficiency_score INTEGER,
  inaction_cost DECIMAL,
  total_savings_all_time DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT get_monthly_total_savings.total_savings FROM get_monthly_total_savings() LIMIT 1),
    (SELECT get_monthly_time_saved.time_saved_hours FROM get_monthly_time_saved() LIMIT 1),
    (SELECT get_monthly_efficiency.efficiency_score FROM get_monthly_efficiency() LIMIT 1),
    (SELECT get_inaction_cost.inaction_cost FROM get_inaction_cost() LIMIT 1),
    (SELECT get_lifetime_total_savings() LIMIT 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_dashboard_stats IS
'Composite function that returns all dashboard metrics including lifetime total savings. Used by getComputedDashboardStats() in actions.ts';

-- ============================================================================
-- Verification Query (for testing in SQL Editor)
-- ============================================================================
-- Test: Check lifetime total
-- SELECT * FROM get_lifetime_total_savings();
-- Expected: Total sum of money_saved_pln from all automations (all time)

-- Test: Check updated dashboard stats
-- SELECT * FROM calculate_dashboard_stats();
-- Expected: 5 columns including total_savings_all_time
