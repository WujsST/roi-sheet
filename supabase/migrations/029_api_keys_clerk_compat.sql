-- Migration 029: api_keys.created_by Clerk-compat + executions_raw INSERT policy
-- Purpose:
--   1. api_keys.created_by was UUID REFERENCES auth.users(id), but app inserts a
--      Clerk user_id string ("user_xxx"). Convert to TEXT, drop FK to auth.users.
--   2. executions_raw had only a SELECT policy after migration 20260203000001.
--      With RLS enabled and no INSERT policy, the webhook can't insert via anon
--      or any authenticated role — only service_role bypasses. We add explicit
--      INSERT/UPDATE/DELETE policies tied to the row's user_id so the webhook
--      can use SUPABASE_SERVICE_ROLE_KEY and we still get clean ownership.
--   3. Drop the auth.uid()-based RLS policy on api_keys (which expects UUID
--      auth.uid()) and replace with the JWT-sub TEXT pattern used elsewhere.

-- ============================================================================
-- 1. api_keys.created_by: UUID → TEXT
-- ============================================================================

alter table public.api_keys
  drop constraint if exists api_keys_created_by_fkey;

-- Cast existing UUID values to text. Idempotent: if already text, no-op via using.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'api_keys'
      and column_name = 'created_by'
      and data_type = 'uuid'
  ) then
    alter table public.api_keys
      alter column created_by type text using created_by::text;
  end if;
end $$;

-- Drop old UUID-based policies, recreate with JWT-sub TEXT pattern
drop policy if exists "Users can view their own API keys" on public.api_keys;
drop policy if exists "Users can create API keys" on public.api_keys;
drop policy if exists "Users can update their own API keys" on public.api_keys;
drop policy if exists "Users can delete their own API keys" on public.api_keys;

create policy "owner can select api_keys" on public.api_keys
  for select using (created_by = (auth.jwt() ->> 'sub'));
create policy "owner can insert api_keys" on public.api_keys
  for insert with check (created_by = (auth.jwt() ->> 'sub'));
create policy "owner can update api_keys" on public.api_keys
  for update using (created_by = (auth.jwt() ->> 'sub'));
create policy "owner can delete api_keys" on public.api_keys
  for delete using (created_by = (auth.jwt() ->> 'sub'));

-- ============================================================================
-- 2. executions_raw: add INSERT/UPDATE/DELETE policies (SELECT already exists)
-- ============================================================================
-- The webhook runs with SUPABASE_SERVICE_ROLE_KEY which bypasses RLS, but we
-- still want sane policies in case anyone touches this table from the app.

drop policy if exists "owner can insert executions_raw" on public.executions_raw;
drop policy if exists "owner can update executions_raw" on public.executions_raw;
drop policy if exists "owner can delete executions_raw" on public.executions_raw;

create policy "owner can insert executions_raw" on public.executions_raw
  for insert with check (user_id = (auth.jwt() ->> 'sub'));
create policy "owner can update executions_raw" on public.executions_raw
  for update using (user_id = (auth.jwt() ->> 'sub'));
create policy "owner can delete executions_raw" on public.executions_raw
  for delete using (user_id = (auth.jwt() ->> 'sub'));
