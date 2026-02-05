-- Migration 025: Rename Execution Fields (Platform-Agnostic)
-- Purpose: Rename n8n-specific columns to platform-agnostic names
-- User requirement: Support multiple automation platforms (n8n, Zapier, Make, etc.)
-- Created: 2026-02-05

-- ============================================================================
-- 1. Rename columns in executions_raw table
-- ============================================================================

-- Rename n8n_workflow_id to workflow_id
ALTER TABLE public.executions_raw
  RENAME COLUMN n8n_workflow_id TO workflow_id;

-- Rename n8n_execution_id to execution_id
ALTER TABLE public.executions_raw
  RENAME COLUMN n8n_execution_id TO execution_id;

-- ============================================================================
-- 2. Add new fields to executions_raw
-- ============================================================================

ALTER TABLE public.executions_raw
  ADD COLUMN IF NOT EXISTS execution_time_ms INTEGER,
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'n8n',
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 3. Add UNIQUE constraint for idempotency
-- ============================================================================

ALTER TABLE public.executions_raw
  ADD CONSTRAINT unique_execution_id UNIQUE (execution_id);

-- ============================================================================
-- 4. Rename column in automations table
-- ============================================================================

ALTER TABLE public.automations
  RENAME COLUMN n8n_workflow_id TO workflow_id;

-- ============================================================================
-- 5. Drop and recreate views with updated column names
-- ============================================================================

DROP VIEW IF EXISTS public.monthly_savings_history CASCADE;
DROP VIEW IF EXISTS public.clients_dashboard CASCADE;
DROP VIEW IF EXISTS public.monthly_automations_stats CASCADE;
DROP VIEW IF EXISTS public.automations_dashboard CASCADE;

-- ============================================================================
-- 6. Recreate automations_dashboard with new column names
-- ============================================================================

CREATE OR REPLACE VIEW public.automations_dashboard AS
SELECT
  a.id,
  a.name,
  a.client_id,
  COALESCE(c.name, 'Brak klienta') as client_name,
  a.workflow_id,
  a.icon,
  a.status,
  a.hourly_rate,
  a.monthly_cost_pln,
  a.created_at,
  a.manual_time_per_execution_seconds,
  COUNT(er.id) as executions_count,
  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) as saved_seconds,
  (COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0 as saved_hours,
  ((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate as money_saved_pln,
  CASE
    WHEN a.monthly_cost_pln > 0 AND a.monthly_cost_pln IS NOT NULL
      THEN ((((COUNT(er.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate) / a.monthly_cost_pln) * 100
    ELSE NULL
  END as roi_percentage,
  MAX(er.created_at) as last_run_at,
  COALESCE(
    (SELECT ((COUNT(er2.id) * COALESCE(a.manual_time_per_execution_seconds, 300)) / 3600.0) * a.hourly_rate
     FROM executions_raw er2
     WHERE er2.workflow_id = a.workflow_id
       AND DATE(er2.created_at) = CURRENT_DATE),
    0
  ) as saved_today
FROM public.automations a
LEFT JOIN public.clients c ON c.id = a.client_id
LEFT JOIN public.executions_raw er ON er.workflow_id = a.workflow_id
GROUP BY a.id, a.name, a.client_id, c.name, a.workflow_id, a.icon, a.status,
         a.hourly_rate, a.monthly_cost_pln, a.created_at, a.manual_time_per_execution_seconds;

COMMENT ON VIEW automations_dashboard IS
'Automations with SIMPLE formula and platform-agnostic fields';

-- ============================================================================
-- 7. Recreate monthly_automations_stats
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
LEFT JOIN public.executions_raw er ON er.workflow_id = a.workflow_id
GROUP BY a.id, a.name, a.client_id, DATE_TRUNC('month', er.created_at),
         a.manual_time_per_execution_seconds, a.hourly_rate;

COMMENT ON VIEW monthly_automations_stats IS
'Monthly aggregated savings with platform-agnostic fields';

-- ============================================================================
-- 8. Recreate clients_dashboard
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
'Client aggregations with platform-agnostic fields';

-- ============================================================================
-- 9. Recreate monthly_savings_history
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
'Last 12 months savings with platform-agnostic fields';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Check executions_raw structure:
-- \d executions_raw
--
-- 2. Check automations structure:
-- \d automations
--
-- 3. Verify UNIQUE constraint:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'executions_raw'::regclass;
--
-- 4. Test views still work:
-- SELECT * FROM automations_dashboard LIMIT 5;
