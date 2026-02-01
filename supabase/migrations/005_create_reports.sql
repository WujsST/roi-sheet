-- Migration: 005_create_reports
-- Description: Create reports table for generated PDF reports
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  period VARCHAR(50),
  file_size VARCHAR(20),
  status VARCHAR(20) DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on reports" ON reports
  FOR SELECT USING (true);

-- Create indexes for common queries
CREATE INDEX idx_reports_client_name ON reports(client_name);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

COMMENT ON TABLE reports IS 'Stores metadata for generated ROI reports';
