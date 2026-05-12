-- Migration 033: multi-tenant via Clerk Organizations
-- Klient-firma (rekord public.clients) dostaje powiązanie z Clerk Organization;
-- członkowie tej Organization widzą dane firmy (read-only) przez RLS.
--
-- Wymagania:
--   1. Migracje 028-032 zaaplikowane (RLS user_id na clients/automations/reports).
--   2. Clerk JWT template "supabase" zawiera custom claim `org_id` (org.id).
--      Bez tego current_org_id() zwróci '' i RLS nie pokaże nic członkom org.

alter table public.clients
  add column if not exists clerk_org_id text unique;

create index if not exists idx_clients_clerk_org_id
  on public.clients(clerk_org_id) where clerk_org_id is not null;

comment on column public.clients.clerk_org_id is
  'Clerk Organization ID (org_xxx). Set when Dawid assigns a Clerk user to this client-firma. NULL = unassigned.';

-- Admin whitelist (na razie pusta — backfill w 034 dla Dawida)
create table if not exists public.admin_users (
  user_id text primary key,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- UI nigdy nie czyta tej tabeli przez RLS (wszystkie zapytania są server-side z service-role).
drop policy if exists admin_users_no_client_access on public.admin_users;
create policy admin_users_no_client_access on public.admin_users
  for all using (false);

-- Helper: czy current jwt sub jest w admin_users?
create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.admin_users where user_id = auth.jwt() ->> 'sub');
$$;

-- Helper: jakie org_id ma current user aktywne w JWT?
create or replace function public.current_org_id() returns text
language sql stable as $$
  select coalesce(auth.jwt() ->> 'org_id', '');
$$;

-- ===========================================================================
-- Update RLS dla clients
-- ===========================================================================

drop policy if exists "Users can view own data_clients" on public.clients;
drop policy if exists clients_select on public.clients;
drop policy if exists clients_modify on public.clients;

create policy clients_select on public.clients for select using (
  public.is_admin()
  or user_id = auth.jwt() ->> 'sub'
  or (clerk_org_id is not null and clerk_org_id = public.current_org_id())
);
create policy clients_insert on public.clients for insert with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy clients_update on public.clients for update using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
) with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy clients_delete on public.clients for delete using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);

-- ===========================================================================
-- Update RLS dla automations
-- ===========================================================================

drop policy if exists "Users can view own data_automations" on public.automations;
drop policy if exists automations_select on public.automations;
drop policy if exists automations_modify on public.automations;

create policy automations_select on public.automations for select using (
  public.is_admin()
  or user_id = auth.jwt() ->> 'sub'
  or exists (
    select 1 from public.clients c
    where c.id = automations.client_id
      and c.clerk_org_id is not null
      and c.clerk_org_id = public.current_org_id()
  )
);
create policy automations_insert on public.automations for insert with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy automations_update on public.automations for update using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
) with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy automations_delete on public.automations for delete using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);

-- ===========================================================================
-- Update RLS dla reports
-- ===========================================================================

drop policy if exists "Users can view own data_reports" on public.reports;
drop policy if exists reports_select on public.reports;
drop policy if exists reports_modify on public.reports;

create policy reports_select on public.reports for select using (
  public.is_admin()
  or user_id = auth.jwt() ->> 'sub'
  or exists (
    select 1 from public.clients c
    where c.id = reports.client_id
      and c.clerk_org_id is not null
      and c.clerk_org_id = public.current_org_id()
  )
);
create policy reports_insert on public.reports for insert with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy reports_update on public.reports for update using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
) with check (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);
create policy reports_delete on public.reports for delete using (
  public.is_admin() or user_id = auth.jwt() ->> 'sub'
);

-- ===========================================================================
-- Update RLS dla executions_raw — scoped przez workflow_id → automation → client
-- ===========================================================================

drop policy if exists "Users can view own executions" on public.executions_raw;
drop policy if exists executions_select on public.executions_raw;

create policy executions_select on public.executions_raw for select using (
  public.is_admin()
  or user_id = auth.jwt() ->> 'sub'
  or exists (
    select 1 from public.automations a
    join public.clients c on c.id = a.client_id
    where a.workflow_id = executions_raw.workflow_id
      and c.clerk_org_id is not null
      and c.clerk_org_id = public.current_org_id()
  )
);
