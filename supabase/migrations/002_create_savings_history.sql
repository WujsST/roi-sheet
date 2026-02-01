-- Migration: 002_create_savings_history
-- Description: Create savings_history table for monthly savings tracking
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS savings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month VARCHAR(10) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE savings_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on savings_history" ON savings_history
  FOR SELECT USING (true);

-- Create index for chronological queries
CREATE INDEX idx_savings_history_created_at ON savings_history(created_at DESC);

COMMENT ON TABLE savings_history IS 'Stores monthly savings data for charts and reports';
