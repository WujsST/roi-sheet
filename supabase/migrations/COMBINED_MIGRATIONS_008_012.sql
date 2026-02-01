-- ====================================================================================
-- COMBINED MIGRATIONS 008-012: Workflow Execution Tracking System
-- ====================================================================================
-- Description: Complete database schema for tracking automation workflow executions
--              with automatic cost calculations, aggregation views, and RPC functions
-- Created: 2026-02-01
-- Instructions: Copy this ENTIRE file and execute in Supabase SQL Editor
-- ====================================================================================

-- ====================================================================================
-- MIGRATION 008: Create workflow_executions table
-- ====================================================================================

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
CREATE INDEX IF NOT EXISTS idx_workflow_executions_automation_id ON workflow_executions(automation_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_client_id ON workflow_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_start_time ON workflow_executions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created_at ON workflow_executions(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_automation_date ON workflow_executions(automation_id, DATE(start_time));
CREATE INDEX IF NOT EXISTS idx_workflow_executions_client_date ON workflow_executions(client_id, DATE(start_time));

-- Row Level Security
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on workflow_executions" ON workflow_executions;
CREATE POLICY "Allow public read access on workflow_executions" ON workflow_executions
  FOR SELECT USING (true);

COMMENT ON TABLE workflow_executions IS 'Tracks individual workflow execution instances with timing and cost calculations';
COMMENT ON COLUMN workflow_executions.duration_seconds IS 'Auto-calculated: (end_time - start_time) in seconds';
COMMENT ON COLUMN workflow_executions.cost_saved IS 'Auto-calculated: (duration_seconds / 3600) * hourly_rate';

-- ====================================================================================
-- MIGRATION 009: Add client_id to automations table
-- ====================================================================================

ALTER TABLE automations ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_automations_client_id ON automations(client_id);

-- Migrate existing data: map client_name to client_id
UPDATE automations a
SET client_id = c.id
FROM clients c
WHERE a.client_name = c.name
  AND a.client_id IS NULL;

COMMENT ON COLUMN automations.client_id IS 'Foreign key to clients table (replaces client_name string for proper relational integrity)';

-- ====================================================================================
-- MIGRATION 010: Create aggregation views
-- ====================================================================================

-- View 1: Daily automation statistics
CREATE OR REPLACE VIEW v_automation_daily_stats AS
SELECT
  automation_id,
  DATE(start_time) as execution_date,
  COUNT(*) as execution_count,
  SUM(duration_seconds) as total_duration_seconds,
  SUM(cost_saved) as total_cost_saved,
  AVG(duration_seconds) as avg_duration_seconds,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM workflow_executions
WHERE end_time IS NOT NULL
GROUP BY automation_id, DATE(start_time);

COMMENT ON VIEW v_automation_daily_stats IS 'Daily aggregated execution statistics per automation';

-- View 2: Monthly savings for chart
CREATE OR REPLACE VIEW v_monthly_savings AS
SELECT
  TO_CHAR(start_time, 'MON') as month_abbr,
  DATE_TRUNC('month', start_time) as month_date,
  SUM(cost_saved) as total_saved
FROM workflow_executions
WHERE status = 'completed'
  AND start_time >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', start_time), TO_CHAR(start_time, 'MON')
ORDER BY month_date;

COMMENT ON VIEW v_monthly_savings IS 'Monthly savings totals for last 6 months (chart data)';

-- View 3: Client ROI metrics
CREATE OR REPLACE VIEW v_client_roi_metrics AS
SELECT
  c.id as client_id,
  c.name as client_name,
  COUNT(DISTINCT we.automation_id) as active_automations,
  COUNT(we.id) as total_executions,
  SUM(we.cost_saved) as total_saved,
  SUM(we.duration_seconds) / 3600.0 as total_hours_saved,
  (COUNT(CASE WHEN we.status = 'completed' THEN 1 END)::FLOAT /
   NULLIF(COUNT(we.id), 0)) * 100 as success_rate
FROM clients c
LEFT JOIN workflow_executions we ON c.id = we.client_id
WHERE we.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name;

COMMENT ON VIEW v_client_roi_metrics IS 'Client-level ROI metrics for last 30 days';

-- ====================================================================================
-- MIGRATION 011: Create metric RPC functions
-- ====================================================================================

-- Function 1: Get monthly total savings
CREATE OR REPLACE FUNCTION get_monthly_total_savings()
RETURNS TABLE(total_savings DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(SUM(cost_saved), 0)::DECIMAL
  FROM workflow_executions
  WHERE status = 'completed'
    AND start_time >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_total_savings IS 'Returns total PLN saved in current month from completed executions';

-- Function 2: Get monthly time saved (hours)
CREATE OR REPLACE FUNCTION get_monthly_time_saved()
RETURNS TABLE(time_saved_hours INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE((SUM(duration_seconds) / 3600), 0)::INTEGER
  FROM workflow_executions
  WHERE status = 'completed'
    AND start_time >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_time_saved IS 'Returns total hours saved in current month';

-- Function 3: Get monthly efficiency score (% success rate)
CREATE OR REPLACE FUNCTION get_monthly_efficiency()
RETURNS TABLE(efficiency_score INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT COALESCE(
    (COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT /
     NULLIF(COUNT(*), 0) * 100),
    0
  )::INTEGER
  FROM workflow_executions
  WHERE end_time IS NOT NULL
    AND start_time >= DATE_TRUNC('month', NOW());
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_monthly_efficiency IS 'Returns efficiency score (percentage of successful executions) for current month';

-- Function 4: Get inaction cost (cost of NOT automating)
CREATE OR REPLACE FUNCTION get_inaction_cost()
RETURNS TABLE(inaction_cost DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH automation_potential AS (
    SELECT
      a.id,
      COALESCE(AVG(we.hourly_rate), 100) as avg_hourly_rate,
      COUNT(we.id) as actual_runs,
      -- Potential runs: days in month * 8 (assumes 8-hour workday)
      EXTRACT(DAY FROM NOW() - DATE_TRUNC('month', NOW()))::INTEGER * 8 as potential_runs
    FROM automations a
    LEFT JOIN workflow_executions we ON a.id = we.automation_id
      AND we.start_time >= DATE_TRUNC('month', NOW())
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

COMMENT ON FUNCTION get_inaction_cost IS 'Calculates cost of NOT running automations at full potential (opportunity cost)';

-- ====================================================================================
-- MIGRATION 012: Seed workflow execution data
-- ====================================================================================

DO $$
DECLARE
  automation_1 UUID;
  automation_2 UUID;
  automation_3 UUID;
  automation_4 UUID;
  automation_5 UUID;
  client_1 UUID;
  client_2 UUID;
  client_3 UUID;
  client_4 UUID;
  client_5 UUID;
BEGIN
  -- Get existing automation IDs
  SELECT id INTO automation_1 FROM automations WHERE name LIKE '%Lead Scoring%' LIMIT 1;
  SELECT id INTO automation_2 FROM automations WHERE name LIKE '%Invoice Parser%' LIMIT 1;
  SELECT id INTO automation_3 FROM automations WHERE name LIKE '%HR Onboarding%' LIMIT 1;
  SELECT id INTO automation_4 FROM automations WHERE name LIKE '%Social Media%' LIMIT 1;
  SELECT id INTO automation_5 FROM automations WHERE name LIKE '%Customer Support%' LIMIT 1;

  -- Get existing client IDs
  SELECT id INTO client_1 FROM clients WHERE name LIKE '%TechCorp%' LIMIT 1;
  SELECT id INTO client_2 FROM clients WHERE name LIKE '%LogisticsPro%' LIMIT 1;
  SELECT id INTO client_3 FROM clients WHERE name LIKE '%StartupHub%' LIMIT 1;
  SELECT id INTO client_4 FROM clients WHERE name LIKE '%MarketingMax%' LIMIT 1;
  SELECT id INTO client_5 FROM clients WHERE name LIKE '%ServiceFirst%' LIMIT 1;

  -- Insert 50 executions for Lead Scoring AI (TechCorp) - mostly successful
  FOR i IN 1..50 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status
    ) VALUES (
      automation_1,
      client_1,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '2 hours'),
      120.00,
      'completed'
    );
  END LOOP;

  -- Insert 40 executions for Invoice Parser (LogisticsPro) - all successful
  FOR i IN 1..40 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status
    ) VALUES (
      automation_2,
      client_2,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '1 hour'),
      150.00,
      'completed'
    );
  END LOOP;

  -- Insert 20 executions for HR Onboarding (StartupHub) - 30% failure rate
  FOR i IN 1..20 LOOP
    INSERT INTO workflow_executions (
      automation_id, client_id, start_time, end_time, hourly_rate, status, error_message
    ) VALUES (
      automation_3,
      client_3,
      NOW() - (RANDOM() * INTERVAL '30 days'),
      NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '30 minutes'),
      100.00,
      CASE WHEN RANDOM() < 0.3 THEN 'failed' ELSE 'completed' END,
      CASE WHEN RANDOM() < 0.3 THEN 'Connection timeout to HRIS API' ELSE NULL END
    );
  END LOOP;

  -- Insert 30 executions for Social Media Scheduler (MarketingMax) - all successful
  IF automation_4 IS NOT NULL AND client_4 IS NOT NULL THEN
    FOR i IN 1..30 LOOP
      INSERT INTO workflow_executions (
        automation_id, client_id, start_time, end_time, hourly_rate, status
      ) VALUES (
        automation_4,
        client_4,
        NOW() - (RANDOM() * INTERVAL '30 days'),
        NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '45 minutes'),
        90.00,
        'completed'
      );
    END LOOP;
  END IF;

  -- Insert 25 executions for Customer Support Bot (ServiceFirst) - some paused/timeout
  IF automation_5 IS NOT NULL AND client_5 IS NOT NULL THEN
    FOR i IN 1..25 LOOP
      INSERT INTO workflow_executions (
        automation_id, client_id, start_time, end_time, hourly_rate, status, error_message
      ) VALUES (
        automation_5,
        client_5,
        NOW() - (RANDOM() * INTERVAL '30 days'),
        NOW() - (RANDOM() * INTERVAL '30 days') + (RANDOM() * INTERVAL '1.5 hours'),
        110.00,
        CASE
          WHEN RANDOM() < 0.1 THEN 'timeout'
          WHEN RANDOM() < 0.05 THEN 'failed'
          ELSE 'completed'
        END,
        CASE
          WHEN RANDOM() < 0.1 THEN 'Execution timeout after 10 minutes'
          WHEN RANDOM() < 0.05 THEN 'Rate limit exceeded'
          ELSE NULL
        END
      );
    END LOOP;
  END IF;

  RAISE NOTICE 'Seeded approximately 165 workflow execution records across 5 automations';

END $$;

-- ====================================================================================
-- VERIFICATION QUERIES (Run these after migration to verify success)
-- ====================================================================================

-- Test 1: Check table exists and count records
-- SELECT COUNT(*) as total_executions FROM workflow_executions;
-- Expected: ~165 records

-- Test 2: Verify computed columns work correctly
-- SELECT id, duration_seconds, hourly_rate, cost_saved,
--        (duration_seconds / 3600.0) * hourly_rate as expected_cost
-- FROM workflow_executions
-- WHERE cost_saved IS NOT NULL
-- LIMIT 5;
-- Expected: cost_saved should equal expected_cost

-- Test 3: Test views
-- SELECT * FROM v_monthly_savings;
-- Expected: Up to 6 rows (depending on data spread)

-- Test 4: Test RPC functions
-- SELECT * FROM get_monthly_total_savings();
-- SELECT * FROM get_monthly_time_saved();
-- SELECT * FROM get_monthly_efficiency();
-- SELECT * FROM get_inaction_cost();
-- Expected: Each returns a single numeric value

-- Test 5: Verify foreign keys
-- SELECT we.id, a.name as automation_name, c.name as client_name
-- FROM workflow_executions we
-- JOIN automations a ON we.automation_id = a.id
-- JOIN clients c ON we.client_id = c.id
-- LIMIT 5;
-- Expected: All JOINs return results

-- ====================================================================================
-- END OF MIGRATIONS
-- ====================================================================================
