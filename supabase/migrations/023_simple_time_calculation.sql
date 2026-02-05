-- Migration 023: SIMPLE Time Calculation (Manual Time Only)
-- Purpose: Use ONLY manual_time × executions (remove automation time subtraction)
-- User requirement: "Mnie interesuje czas ile manualnie sie zaoszczedzilo"
-- Formula: saved_time = manual_time × executions
-- Created: 2026-02-05

-- ============================================================================
-- 1. Drop dependent views first
-- ============================================================================
DROP VIEW IF EXISTS public.monthly_savings_history CASCADE;
DROP VIEW IF EXISTS public.clients_dashboard CASCADE;
DROP VIEW IF EXISTS public.monthly_automations_stats CASCADE;
DROP VIEW IF EXISTS public.automations_dashboard CASCADE;

-- ============================================================================
-- 2. Recreate automations_dashboard with SIMPLE formula
-- ============================================================================

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
  a.monthly_cost_pln,
  a.created_at,

  -- Time tracking field (ONLY manual time)
  a.manual_time_per_execution_seconds,

  -- Execution metrics
  COUNT(er.id) as executions_count,

  -- SIMPLE FORMULA: manual_time × executions
  -- This represents total MANUAL time that would have been spent
  -- We saved this much time by automating (regardless of how long automation takes)
  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) as saved_seconds,

  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0 as saved_hours,

  -- Money saved: saved_hours × hourly_rate
  ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate as money_saved_pln,

  -- ROI percentage: (money_saved / monthly_cost) × 100
  CASE
    WHEN a.monthly_cost_pln > 0 AND a.monthly_cost_pln IS NOT NULL
      THEN ((((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate) / a.monthly_cost_pln) * 100
    ELSE NULL
  END as roi_percentage,

  -- Last execution timestamp
  MAX(er.created_at) as last_run_at,

  -- Today's savings
  COALESCE(
    (SELECT ((COUNT(er2.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate
     FROM executions_raw er2
     WHERE er2.n8n_workflow_id = a.n8n_workflow_id
       AND DATE(er2.created_at) = CURRENT_DATE),
    0
  ) as saved_today

FROM public.automations a
LEFT JOIN public.clients c ON c.id = a.client_id
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, c.name, a.n8n_workflow_id, a.icon, a.status,
         a.hourly_rate, a.monthly_cost_pln, a.created_at, a.manual_time_per_execution_seconds;

COMMENT ON VIEW automations_dashboard IS
'Automations with SIMPLE formula: saved_time = manual_time × executions (user requested)';

-- ============================================================================
-- 3. Recreate monthly_automations_stats
-- ============================================================================

CREATE OR REPLACE VIEW public.monthly_automations_stats AS
SELECT
  a.id as automation_id,
  a.name,
  a.client_id,
  DATE_TRUNC('month', er.created_at) as month,

  COUNT(er.id) as executions_count,

  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0 as saved_hours,

  ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate as money_saved_pln

FROM public.automations a
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, DATE_TRUNC('month', er.created_at),
         a.manual_time_per_execution_seconds, a.hourly_rate;

COMMENT ON VIEW monthly_automations_stats IS
'Monthly aggregated savings using simple formula: manual_time × executions';

-- ============================================================================
-- 4. Recreate clients_dashboard
-- ============================================================================

CREATE OR REPLACE VIEW public.clients_dashboard AS
SELECT
  c.id as client_id,
  c.name as client_name,

  COUNT(DISTINCT a.id) as automations_count,
  COALESCE(SUM(stats.executions_count), 0) as executions_count,

  COALESCE(SUM(stats.money_saved_pln), 0) as money_saved_pln_total,
  COALESCE(SUM(stats.saved_hours), 0) as saved_hours_total

FROM public.clients c
LEFT JOIN public.automations a ON a.client_id = c.id
LEFT JOIN public.monthly_automations_stats stats ON stats.automation_id = a.id
GROUP BY c.id, c.name;

COMMENT ON VIEW clients_dashboard IS
'Client aggregations from monthly_automations_stats';

-- ============================================================================
-- 5. Recreate monthly_savings_history
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
'Last 12 months savings for bar chart';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Check that time calculations use SIMPLE formula (manual_time × executions):
-- SELECT
--   id, name, executions_count,
--   manual_time_per_execution_seconds,
--   saved_hours,
--   money_saved_pln
-- FROM automations_dashboard
-- WHERE executions_count > 0;
--
-- 2. Verify client aggregations:
-- SELECT * FROM clients_dashboard;
--
-- 3. Test with client "TET" (4 executions, 5 min manual time):
-- Expected: saved_hours = 4 × 300 / 3600 = 0.333h (SIMPLE formula)
-- Expected: money_saved_pln = 0.333h × 250 PLN/h = 83.33 PLN
