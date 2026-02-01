-- Migration: 006_create_system_logs
-- Description: Create system_logs table for application logging
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level VARCHAR(10) CHECK (level IN ('info', 'warn', 'error')),
  source VARCHAR(100),
  message TEXT
);

-- Enable Row Level Security
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on system_logs" ON system_logs
  FOR SELECT USING (true);

-- Create indexes for common queries
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp DESC);
CREATE INDEX idx_system_logs_level ON system_logs(level);
CREATE INDEX idx_system_logs_source ON system_logs(source);

COMMENT ON TABLE system_logs IS 'Stores application logs for monitoring and debugging';
