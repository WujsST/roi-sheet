-- Migration 021: Update Default ROI Values for Existing Automations
-- Purpose: Set reasonable default values for seconds_saved_per_execution and monthly_cost_pln
-- Created: 2026-02-03

-- ============================================================================
-- 1. Update automations with 0 seconds_saved to reasonable default
-- ============================================================================

-- Set 5 minutes (300 seconds) as default time saved per execution
-- This is a conservative estimate for most automation tasks
UPDATE public.automations
SET seconds_saved_per_execution = 300
WHERE seconds_saved_per_execution = 0
  AND n8n_workflow_id IS NOT NULL;

-- ============================================================================
-- 2. Optionally set default monthly cost if not set
-- ============================================================================

-- Set 50 PLN as default monthly cost for automations
-- This represents a typical n8n/Zapier/Make subscription cost per workflow
UPDATE public.automations
SET monthly_cost_pln = 50
WHERE monthly_cost_pln = 0
  AND n8n_workflow_id IS NOT NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Check updated values:
-- SELECT id, name, seconds_saved_per_execution, monthly_cost_pln, hourly_rate
-- FROM automations
-- WHERE n8n_workflow_id IS NOT NULL;
--
-- 2. Verify calculations now show non-zero values:
-- SELECT * FROM automations_dashboard WHERE executions_count > 0;
--
-- 3. Verify clients_dashboard shows aggregated savings:
-- SELECT * FROM clients_dashboard;
