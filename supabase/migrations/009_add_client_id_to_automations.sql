-- Migration: 009_add_client_id_to_automations
-- Description: Add client_id foreign key to automations table
-- Created: 2026-02-01

ALTER TABLE automations ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_automations_client_id ON automations(client_id);

-- Migrate existing data: map client_name to client_id
UPDATE automations a
SET client_id = c.id
FROM clients c
WHERE a.client_name = c.name
  AND a.client_id IS NULL;

COMMENT ON COLUMN automations.client_id IS 'Foreign key to clients table (replaces client_name string for proper relational integrity)';
