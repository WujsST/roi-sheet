-- Migration: 003_create_dashboard_stats
-- Description: Create dashboard_stats table for main KPI metrics
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS dashboard_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_savings DECIMAL(10,2) DEFAULT 0,
  time_saved_hours INTEGER DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0,
  inaction_cost DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on dashboard_stats" ON dashboard_stats
  FOR SELECT USING (true);

COMMENT ON TABLE dashboard_stats IS 'Stores aggregated dashboard KPI metrics';
