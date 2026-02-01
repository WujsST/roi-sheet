-- Migration: 001_create_automations
-- Description: Create automations table for tracking automation instances
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Zap',
  status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'error', 'paused')),
  saved_today DECIMAL(10,2) DEFAULT 0,
  uptime DECIMAL(5,2) DEFAULT 99.9,
  last_run TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (adjust based on your auth requirements)
CREATE POLICY "Allow public read access on automations" ON automations
  FOR SELECT USING (true);

-- Create index for common queries
CREATE INDEX idx_automations_status ON automations(status);
CREATE INDEX idx_automations_client_name ON automations(client_name);
CREATE INDEX idx_automations_created_at ON automations(created_at DESC);

COMMENT ON TABLE automations IS 'Stores automation instances and their current status';
