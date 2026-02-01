-- Migration: 010_create_aggregation_views
-- Description: Create database views for metrics aggregation
-- Created: 2026-02-01

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
