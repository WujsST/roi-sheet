-- Migration 022: Fix Time Calculation in Views
-- Purpose: Use manual_time and automation_time fields instead of seconds_saved_per_execution
-- Created: 2026-02-04

-- ============================================================================
-- 1. Drop and Recreate automations_dashboard View
-- ============================================================================

DROP VIEW IF EXISTS public.automations_dashboard;

CREATE OR REPLACE VIEW public.automations_dashboard AS
SELECT
  a.id,
  a.name,
  a.client_id,
  COALESCE(c.name, 'Brak klienta') as client_name,
  a.n8n_workflow_id as workflow_id,
  a.icon,
  a.status,
  a.hourly_rate,

  -- Keep legacy field for backward compatibility
  a.seconds_saved_per_execution,

  -- New time tracking fields
  a.manual_time_per_execution_seconds,
  a.automation_time_per_execution_seconds,

  a.monthly_cost_pln,
  a.created_at,

  -- Execution metrics
  COUNT(er.id) as executions_count,

  -- FIXED: Calculate time saved per execution as (manual_time - automation_time)
  -- This is the ACTUAL time saved, not a static estimate
  GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  ) as calculated_seconds_saved_per_execution,

  -- Time saved calculations (USING CALCULATED FIELD)
  (COUNT(er.id) * GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  )) as saved_seconds,

  (COUNT(er.id) * GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  )) / 3600.0 as saved_hours,

  -- Money saved calculation (USING CALCULATED TIME)
  ((COUNT(er.id) * GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  )) / 3600.0) * a.hourly_rate as money_saved_pln,

  -- ROI percentage (BASED ON CALCULATED SAVINGS)
  CASE
    WHEN a.monthly_cost_pln > 0
      THEN (((COUNT(er.id) * GREATEST(
        COALESCE(a.manual_time_per_execution_seconds, 300) -
        COALESCE(a.automation_time_per_execution_seconds, 30),
        0
      )) / 3600.0) * a.hourly_rate / a.monthly_cost_pln) * 100
    ELSE NULL
  END as roi_percentage,

  -- Last execution timestamp
  MAX(er.created_at) as last_run_at,

  -- Today's savings
  COALESCE(
    (SELECT ((COUNT(er2.id) * GREATEST(
      COALESCE(a.manual_time_per_execution_seconds, 300) -
      COALESCE(a.automation_time_per_execution_seconds, 30),
      0
    )) / 3600.0) * a.hourly_rate
     FROM executions_raw er2
     WHERE er2.n8n_workflow_id = a.n8n_workflow_id
       AND DATE(er2.created_at) = CURRENT_DATE),
    0
  ) as saved_today

FROM public.automations a
LEFT JOIN public.clients c ON c.id = a.client_id
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, c.name, a.n8n_workflow_id, a.icon, a.status,
         a.hourly_rate, a.seconds_saved_per_execution, a.monthly_cost_pln, a.created_at,
         a.manual_time_per_execution_seconds, a.automation_time_per_execution_seconds;

COMMENT ON VIEW automations_dashboard IS
'Automations with ROI metrics calculated from manual_time - automation_time difference';

-- ============================================================================
-- 2. Drop dependent views first
-- ============================================================================

DROP VIEW IF EXISTS public.monthly_savings_history;
DROP VIEW IF EXISTS public.clients_dashboard;

-- ============================================================================
-- 3. Update monthly_automations_stats View
-- ============================================================================

DROP VIEW IF EXISTS public.monthly_automations_stats;

CREATE OR REPLACE VIEW public.monthly_automations_stats AS
SELECT
  a.id as automation_id,
  a.name,
  a.client_id,
  DATE_TRUNC('month', er.created_at) as month,

  -- Monthly metrics (USING CALCULATED TIME DIFFERENCE)
  COUNT(er.id) as executions_count,

  (COUNT(er.id) * GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  )) / 3600.0 as saved_hours,

  ((COUNT(er.id) * GREATEST(
    COALESCE(a.manual_time_per_execution_seconds, 300) -
    COALESCE(a.automation_time_per_execution_seconds, 30),
    0
  )) / 3600.0) * a.hourly_rate as money_saved_pln

FROM public.automations a
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, DATE_TRUNC('month', er.created_at),
         a.manual_time_per_execution_seconds, a.automation_time_per_execution_seconds, a.hourly_rate;

COMMENT ON VIEW monthly_automations_stats IS
'Automations with ROI metrics aggregated by month using calculated time saved (manual - automation)';

-- ============================================================================
-- 4. Recreate clients_dashboard View
-- ============================================================================

CREATE OR REPLACE VIEW public.clients_dashboard AS
SELECT
  c.id as client_id,
  c.name as client_name,

  -- Aggregated counts
  COUNT(DISTINCT a.id) as automations_count,
  COALESCE(SUM(stats.executions_count), 0) as executions_count,

  -- Aggregated savings (from monthly_automations_stats)
  COALESCE(SUM(stats.money_saved_pln), 0) as money_saved_pln_total,
  COALESCE(SUM(stats.saved_hours), 0) as saved_hours_total

FROM public.clients c
LEFT JOIN public.automations a ON a.client_id = c.id
LEFT JOIN public.monthly_automations_stats stats ON stats.automation_id = a.id
GROUP BY c.id, c.name;

COMMENT ON VIEW clients_dashboard IS
'Aggregated ROI metrics per client from monthly_automations_stats';

-- ============================================================================
-- 5. Recreate Monthly Savings History View
-- ============================================================================

CREATE OR REPLACE VIEW public.monthly_savings_history AS
SELECT
  TO_CHAR(month, 'Mon') as month_abbr,
  month::DATE as month_date,
  SUM(money_saved_pln) as total_saved
FROM monthly_automations_stats
WHERE month >= DATE_TRUNC('month', NOW() - INTERVAL '11 months')
  AND month IS NOT NULL
GROUP BY month
ORDER BY month;

COMMENT ON VIEW monthly_savings_history IS
'Last 12 months of savings aggregated by month. Maps to MonthlySavings interface for barchart visualization.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Check that time calculations show non-zero values:
-- SELECT
--   id, name, executions_count,
--   manual_time_per_execution_seconds,
--   automation_time_per_execution_seconds,
--   calculated_seconds_saved_per_execution,
--   saved_hours,
--   money_saved_pln
-- FROM automations_dashboard
-- WHERE executions_count > 0;
--
-- 2. Verify client aggregations:
-- SELECT * FROM clients_dashboard;
--
-- 3. Test with client "TET" (4 executions, 5 min manual time):
-- Expected: saved_hours ≈ 0.3h (4 executions × (300-30) / 3600)
-- Expected: money_saved_pln ≈ 75 PLN (0.3h × 250 PLN/h)
