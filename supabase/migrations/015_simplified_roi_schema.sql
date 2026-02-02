-- Migration 015: Simplified ROI Architecture
-- Purpose: Eliminate workflow_executions table, use direct views with ROI calculations
-- Created: 2026-02-02

-- ============================================================================
-- 1. Add ROI Columns to automations Table
-- ============================================================================

ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS seconds_saved_per_execution NUMERIC NOT NULL DEFAULT 0;

ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS monthly_cost_pln NUMERIC NOT NULL DEFAULT 0;

-- Ensure hourly_rate exists (may already be present)
ALTER TABLE public.automations
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC NOT NULL DEFAULT 150;

COMMENT ON COLUMN automations.seconds_saved_per_execution IS
'Time saved per single execution in seconds (e.g., 300 = 5 minutes)';

COMMENT ON COLUMN automations.monthly_cost_pln IS
'Monthly cost of automation for ROI calculation (PLN)';

COMMENT ON COLUMN automations.hourly_rate IS
'Hourly rate for ROI calculation (PLN/hour)';

-- ============================================================================
-- 2. Create Indexes for Performance
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS automations_n8n_workflow_id_unique
ON public.automations (n8n_workflow_id);

CREATE INDEX IF NOT EXISTS executions_raw_n8n_workflow_id_idx
ON public.executions_raw (n8n_workflow_id);

CREATE INDEX IF NOT EXISTS executions_raw_created_at_idx
ON public.executions_raw (created_at);

-- ============================================================================
-- 3. Drop Old View (from migration 013)
-- ============================================================================

DROP VIEW IF EXISTS automations_dashboard;

-- ============================================================================
-- 4. Create automations_dashboard View with ROI Calculations
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
  a.seconds_saved_per_execution,
  a.monthly_cost_pln,
  a.created_at,

  -- Execution metrics
  COUNT(er.id) as executions_count,

  -- Time saved calculations
  (COUNT(er.id) * a.seconds_saved_per_execution) as saved_seconds,
  (COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0 as saved_hours,

  -- Money saved calculation
  ((COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate as money_saved_pln,

  -- ROI percentage
  CASE
    WHEN a.monthly_cost_pln > 0
      THEN (((COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate / a.monthly_cost_pln) * 100
    ELSE NULL
  END as roi_percentage,

  -- Last execution timestamp
  MAX(er.created_at) as last_run_at,

  -- Today's savings (for backwards compatibility with existing UI)
  COALESCE(
    (SELECT ((COUNT(er2.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate
     FROM executions_raw er2
     WHERE er2.n8n_workflow_id = a.n8n_workflow_id
       AND DATE(er2.created_at) = CURRENT_DATE),
    0
  ) as saved_today

FROM public.automations a
LEFT JOIN public.clients c ON c.id = a.client_id
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, c.name, a.n8n_workflow_id, a.icon, a.status,
         a.hourly_rate, a.seconds_saved_per_execution, a.monthly_cost_pln, a.created_at;

COMMENT ON VIEW automations_dashboard IS
'Automations with ROI metrics calculated from direct join to executions_raw';

-- ============================================================================
-- 5. Create clients_dashboard View
-- ============================================================================

CREATE OR REPLACE VIEW public.clients_dashboard AS
SELECT
  c.id as client_id,
  c.name as client_name,

  -- Aggregated counts
  COUNT(DISTINCT a.id) as automations_count,
  COUNT(er.id) as executions_count,

  -- Aggregated savings
  SUM(((COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate) as money_saved_pln_total,
  SUM((COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0) as saved_hours_total

FROM public.clients c
LEFT JOIN public.automations a ON a.client_id = c.id
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY c.id, c.name;

COMMENT ON VIEW clients_dashboard IS
'Aggregated ROI metrics per client';

-- ============================================================================
-- 6. Create Monthly Automations Stats View (for filtering by month)
-- ============================================================================

CREATE OR REPLACE VIEW public.monthly_automations_stats AS
SELECT
  a.id as automation_id,
  a.name,
  a.client_id,
  DATE_TRUNC('month', er.created_at) as month,

  -- Monthly metrics
  COUNT(er.id) as executions_count,
  (COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0 as saved_hours,
  ((COUNT(er.id) * a.seconds_saved_per_execution) / 3600.0) * a.hourly_rate as money_saved_pln

FROM public.automations a
LEFT JOIN public.executions_raw er ON er.n8n_workflow_id = a.n8n_workflow_id
GROUP BY a.id, a.name, a.client_id, DATE_TRUNC('month', er.created_at);

COMMENT ON VIEW monthly_automations_stats IS
'Automations with ROI metrics aggregated by month from executions_raw. Used for monthly filtering and barcharts.';

-- ============================================================================
-- 7. Create Monthly Savings History View (for barcharts)
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
-- 8. Update calculate_dashboard_stats() to Use New Views
-- ============================================================================

-- Drop old functions that reference workflow_executions
DROP FUNCTION IF EXISTS get_monthly_total_savings();
DROP FUNCTION IF EXISTS get_monthly_time_saved();
DROP FUNCTION IF EXISTS get_monthly_efficiency();
DROP FUNCTION IF EXISTS get_inaction_cost();
DROP FUNCTION IF EXISTS calculate_dashboard_stats();

-- Recreate with new logic based on monthly_automations_stats view
CREATE OR REPLACE FUNCTION get_monthly_total_savings()
RETURNS TABLE(total_savings DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(money_saved_pln), 0)::DECIMAL
  FROM monthly_automations_stats
  WHERE month = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_time_saved()
RETURNS TABLE(time_saved_hours INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(saved_hours), 0)::INTEGER
  FROM monthly_automations_stats
  WHERE month = DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthly_efficiency()
RETURNS TABLE(efficiency_score INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    (COUNT(CASE WHEN er.status = 'success' THEN 1 END)::FLOAT /
     NULLIF(COUNT(*), 0) * 100),
    0
  )::INTEGER
  FROM executions_raw er
  WHERE er.created_at >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_inaction_cost()
RETURNS TABLE(inaction_cost DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH automation_potential AS (
    SELECT
      a.id,
      COALESCE(a.hourly_rate, 150) as avg_hourly_rate,
      COUNT(er.id) as actual_runs,
      EXTRACT(DAY FROM NOW() - DATE_TRUNC('month', NOW()))::INTEGER * 8 as potential_runs
    FROM automations a
    LEFT JOIN executions_raw er ON a.n8n_workflow_id = er.n8n_workflow_id
      AND er.created_at >= DATE_TRUNC('month', NOW())
    WHERE a.status != 'paused'
    GROUP BY a.id
  )
  SELECT COALESCE(
    SUM((potential_runs - COALESCE(actual_runs, 0)) * avg_hourly_rate),
    0
  )::DECIMAL
  FROM automation_potential
  WHERE potential_runs > actual_runs;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_dashboard_stats()
RETURNS TABLE(
  total_savings DECIMAL,
  time_saved_hours INTEGER,
  efficiency_score INTEGER,
  inaction_cost DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT get_monthly_total_savings.total_savings FROM get_monthly_total_savings() LIMIT 1),
    (SELECT get_monthly_time_saved.time_saved_hours FROM get_monthly_time_saved() LIMIT 1),
    (SELECT get_monthly_efficiency.efficiency_score FROM get_monthly_efficiency() LIMIT 1),
    (SELECT get_inaction_cost.inaction_cost FROM get_inaction_cost() LIMIT 1);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_dashboard_stats IS
'Composite dashboard stats function - now using monthly_automations_stats view with proper monthly filtering';

-- ============================================================================
-- 7. Optional: Drop workflow_executions Table (if exists)
-- ============================================================================
-- Uncomment if you want to clean up the obsolete table
-- DROP TABLE IF EXISTS workflow_executions CASCADE;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Test automations_dashboard view:
-- SELECT * FROM automations_dashboard;
--
-- 2. Test clients_dashboard view:
-- SELECT * FROM clients_dashboard;
--
-- 3. Test RPC function:
-- SELECT * FROM calculate_dashboard_stats();
--
-- 4. Update sample data to see calculations:
-- UPDATE automations
-- SET
--   seconds_saved_per_execution = 300,
--   monthly_cost_pln = 100,
--   hourly_rate = 150
-- WHERE n8n_workflow_id IS NOT NULL;
