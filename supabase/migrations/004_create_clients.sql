-- Migration: 004_create_clients
-- Description: Create clients table for client management
-- Created: 2026-01-28

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'warning', 'inactive')),
  automations_count INTEGER DEFAULT 0,
  saved_amount DECIMAL(10,2) DEFAULT 0,
  roi_percentage DECIMAL(5,2) DEFAULT 0,
  logo VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access on clients" ON clients
  FOR SELECT USING (true);

-- Create indexes for common queries
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

COMMENT ON TABLE clients IS 'Stores client information and their ROI metrics';
