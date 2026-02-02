-- Migration 014: Migrate Data from executions_raw to workflow_executions
-- Purpose: Process raw n8n execution data into calculated workflow_executions format
-- Created: 2026-02-02

-- ============================================================================
-- Data Migration Script
-- ============================================================================
-- This script processes existing executions from executions_raw table
-- and inserts them into workflow_executions with calculated metrics

INSERT INTO workflow_executions (
  automation_id,
  client_id,
  start_time,
  end_time,
  duration_seconds,
  hourly_rate,
  cost_saved,
  status,
  error_message,
  execution_metadata,
  created_at
)
SELECT
  a.id as automation_id,
  a.client_id,
  er.started_at as start_time,
  er.stopped_at as end_time,
  EXTRACT(EPOCH FROM (er.stopped_at - er.started_at))::INTEGER as duration_seconds,
  COALESCE(a.hourly_rate, 100.00) as hourly_rate,
  ROUND(
    (EXTRACT(EPOCH FROM (er.stopped_at - er.started_at)) / 3600.0) * COALESCE(a.hourly_rate, 100.00),
    2
  ) as cost_saved,
  CASE
    WHEN er.status = 'success' AND er.finished = true THEN 'completed'
    WHEN er.status = 'error' THEN 'failed'
    WHEN er.finished = false THEN 'running'
    ELSE 'timeout'
  END as status,
  CASE
    WHEN er.status = 'error' THEN 'Execution failed - check n8n logs'
    ELSE NULL
  END as error_message,
  jsonb_build_object(
    'n8n_execution_id', er.n8n_execution_id,
    'n8n_workflow_id', er.n8n_workflow_id,
    'mode', er.mode,
    'original_payload', er.payload
  ) as execution_metadata,
  er.created_at
FROM executions_raw er
INNER JOIN automations a ON a.n8n_workflow_id = er.n8n_workflow_id
WHERE NOT EXISTS (
  -- Avoid duplicate migration if script is run multiple times
  SELECT 1 FROM workflow_executions we
  WHERE we.execution_metadata->>'n8n_execution_id' = er.n8n_execution_id
);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- After running this migration, verify data was migrated correctly:
--
-- SELECT
--   we.id,
--   we.automation_id,
--   a.name as automation_name,
--   we.duration_seconds,
--   we.hourly_rate,
--   we.cost_saved,
--   we.status,
--   we.execution_metadata->>'n8n_execution_id' as n8n_execution_id
-- FROM workflow_executions we
-- JOIN automations a ON a.id = we.automation_id
-- ORDER BY we.start_time DESC;
--
-- Expected: 4 rows with calculated cost_saved values

COMMENT ON TABLE workflow_executions IS
'Processed workflow execution records with calculated ROI metrics. Populated from executions_raw via migration 014.';
