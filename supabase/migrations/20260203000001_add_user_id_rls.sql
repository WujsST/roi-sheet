-- Add user_id to tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.automations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.executions_raw ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id); -- No default for webhook inserts
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Update app_settings PK (Clean slate approach for consistency)
DELETE FROM public.app_settings WHERE user_id IS NULL;
-- If any rows remain (e.g. from testing), we assume they should be deleted or manually handled.
-- For this migration, we enforce user isolation, so previous global settings are invalid.

ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_pkey;
-- Make user_id NOT NULL only if we are sure (using DEFAULT auth.uid() handles new inserts, but existing rows need it)
-- Since we deleted NULLs:
ALTER TABLE public.app_settings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.app_settings ADD PRIMARY KEY (user_id, key);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Clients
DROP POLICY IF EXISTS "Users can view own data" ON public.clients;
CREATE POLICY "Users can view own data" ON public.clients FOR ALL USING (auth.uid() = user_id);

-- Automations
DROP POLICY IF EXISTS "Users can view own data" ON public.automations;
CREATE POLICY "Users can view own data" ON public.automations FOR ALL USING (auth.uid() = user_id);

-- Reports
DROP POLICY IF EXISTS "Users can view own data" ON public.reports;
CREATE POLICY "Users can view own data" ON public.reports FOR ALL USING (auth.uid() = user_id);

-- App Settings
DROP POLICY IF EXISTS "Users can view own settings" ON public.app_settings;
CREATE POLICY "Users can view own settings" ON public.app_settings FOR ALL USING (auth.uid() = user_id);

-- Executions Raw
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions_raw;
CREATE POLICY "Users can view own executions" ON public.executions_raw FOR SELECT USING (auth.uid() = user_id);

-- Note: Webhook insertions happen via Service Role, bypassing RLS.
