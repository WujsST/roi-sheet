-- Migration 024: Create API Keys Table
-- Purpose: Dedicated table for API key management (replacing app_settings)
-- User requirement: Production-ready webhook authentication
-- Created: 2026-02-05

-- ============================================================================
-- 1. Create api_keys table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,  -- First 12 chars for display (e.g., "roi_live_ak_")
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 2. Create indexes
-- ============================================================================

CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_api_keys_created_by ON public.api_keys(created_by);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. Create RLS policies
-- ============================================================================

CREATE POLICY "Users can view their own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================================
-- 5. Add table comment
-- ============================================================================

COMMENT ON TABLE public.api_keys IS 'API keys for webhook authentication (hashed storage)';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- After running this migration, verify:
--
-- 1. Check table structure:
-- \d api_keys
--
-- 2. Verify indexes:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'api_keys';
--
-- 3. Verify RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'api_keys';
