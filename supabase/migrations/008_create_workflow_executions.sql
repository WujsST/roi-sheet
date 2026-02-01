-- Migration: 008_create_workflow_executions
-- Description: Create workflow_executions table for tracking automation runs
-- Created: 2026-02-01

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Keys (required fields)
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Execution time tracking
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER GENERATED ALWAYS AS
    (EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER) STORED,

  -- Financial data
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 100.00,
  cost_saved DECIMAL(10,2) GENERATED ALWAYS AS
    ((duration_seconds / 3600.0) * hourly_rate) STORED,

  -- Execution status
  status VARCHAR(20) DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  error_message TEXT,

  -- Metadata
  execution_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_workflow_executions_automation_id ON workflow_executions(automation_id);
CREATE INDEX idx_workflow_executions_client_id ON workflow_executions(client_id);
CREATE INDEX idx_workflow_executions_start_time ON workflow_executions(start_time DESC);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_workflow_executions_automation_date ON workflow_executions(automation_id, DATE(start_time));
CREATE INDEX idx_workflow_executions_client_date ON workflow_executions(client_id, DATE(start_time));

-- Row Level Security
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on workflow_executions" ON workflow_executions
  FOR SELECT USING (true);

COMMENT ON TABLE workflow_executions IS 'Tracks individual workflow execution instances with timing and cost calculations';
COMMENT ON COLUMN workflow_executions.duration_seconds IS 'Auto-calculated: (end_time - start_time) in seconds';
COMMENT ON COLUMN workflow_executions.cost_saved IS 'Auto-calculated: (duration_seconds / 3600) * hourly_rate';
