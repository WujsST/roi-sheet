-- Migration: 011_create_metric_functions
-- Description: Create PostgreSQL RPC functions for dashboard metrics
-- Created: 2026-02-01

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
