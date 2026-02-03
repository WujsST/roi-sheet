-- 1. Drop Policies FIRST (they depend on user_id)
DROP POLICY IF EXISTS "Users can view own data" ON public.clients;
DROP POLICY IF EXISTS "Users can view own data_clients" ON public.clients;
DROP POLICY IF EXISTS "Users can view own data" ON public.automations;
DROP POLICY IF EXISTS "Users can view own data_automations" ON public.automations;
DROP POLICY IF EXISTS "Users can view own data" ON public.reports;
DROP POLICY IF EXISTS "Users can view own data_reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view own settings" ON public.app_settings;
DROP POLICY IF EXISTS "Users can view own executions" ON public.executions_raw;

-- 2. Drop Foreign Keys
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;
ALTER TABLE public.automations DROP CONSTRAINT IF EXISTS automations_user_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
ALTER TABLE public.executions_raw DROP CONSTRAINT IF EXISTS executions_raw_user_id_fkey;
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_user_id_fkey;

-- 3. Change user_id to TEXT
ALTER TABLE public.clients ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.automations ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.reports ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.executions_raw ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.app_settings ALTER COLUMN user_id TYPE TEXT;

-- 4. Update Defaults (Remove auth.uid() default which casts to UUID)
ALTER TABLE public.clients ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.automations ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.reports ALTER COLUMN user_id DROP DEFAULT;
ALTER TABLE public.app_settings ALTER COLUMN user_id DROP DEFAULT;

-- 5. Re-create Policies
CREATE POLICY "Users can view own data_clients" ON public.clients FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view own data_automations" ON public.automations FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view own data_reports" ON public.reports FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view own settings" ON public.app_settings FOR ALL USING (user_id = (auth.jwt() ->> 'sub'));
CREATE POLICY "Users can view own executions" ON public.executions_raw FOR SELECT USING (user_id = (auth.jwt() ->> 'sub'));
