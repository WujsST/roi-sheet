-- Migration 013: Create workflow_executions Table, Dashboard Stats Function, and Views
-- Purpose: Fix dashboard showing zeros by creating proper execution tracking table
-- Created: 2026-02-02

-- ============================================================================
-- 1. Create workflow_executions Table
-- ============================================================================
-- This table stores processed execution data with calculated metrics
-- Data can be populated from executions_raw using triggers or batch jobs

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  cost_saved NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  error_message TEXT,
  execution_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_automation ON workflow_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_client ON workflow_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_start_time ON workflow_executions(start_time);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);

COMMENT ON TABLE workflow_executions IS 'Processed workflow execution records with calculated ROI metrics';

-- ============================================================================
-- 2. Composite RPC Function: calculate_dashboard_stats()
-- ============================================================================
-- Combines all 4 individual metric functions into one call
-- Uses qualified column names to avoid PostgreSQL ambiguity errors

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
'Composite function that returns all dashboard metrics in one call. Used by getComputedDashboardStats() in actions.ts';

-- ============================================================================
-- 3. Automations Dashboard View
-- ============================================================================
-- Joins automations with client names for dashboard display
-- Maps n8n_workflow_id to workflow_id and adds computed saved_today column

CREATE OR REPLACE VIEW automations_dashboard AS
SELECT
  a.id,
  a.name,
  a.icon,
  a.status,
  a.n8n_workflow_id as workflow_id,
  a.hourly_rate,
  a.created_at,
  a.client_id,
  COALESCE(c.name, 'Brak klienta') as client_name,
  COALESCE(
    (SELECT SUM(cost_saved)
     FROM workflow_executions we
     WHERE we.automation_id = a.id
       AND DATE(we.start_time) = CURRENT_DATE
       AND we.status = 'completed'),
    0
  ) as saved_today
FROM automations a
LEFT JOIN clients c ON a.client_id = c.id;

COMMENT ON VIEW automations_dashboard IS
'Automations with joined client names and computed saved_today from workflow_executions. Used by getAutomationsData() in actions.ts';

-- ============================================================================
-- Verification Queries (for testing in SQL Editor)
-- ============================================================================
-- Test 1: Verify table created
-- SELECT * FROM workflow_executions;
-- Expected: Empty table with proper schema

-- Test 2: Verify RPC function works
-- SELECT * FROM calculate_dashboard_stats();
-- Expected: 1 row with 4 columns (zeros if no executions yet)

-- Test 3: Verify automations view
-- SELECT * FROM automations_dashboard;
-- Expected: All automations with client_name and saved_today populated
