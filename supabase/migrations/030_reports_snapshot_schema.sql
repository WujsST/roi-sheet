-- Migration 030: reports table → real snapshot schema
-- Purpose: today reports table holds metadata only (title, period text, file_size).
-- Reports are not actually preserved — opening a "saved" report re-renders live data.
-- We add: client_id FK, period_from/period_to dates, snapshot_data JSONB, pdf_storage_path.
-- Old fields period (text) and file_size remain unused — drop after verifying no callers.

alter table public.reports
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists period_from date,
  add column if not exists period_to date,
  add column if not exists snapshot_data jsonb not null default '{}'::jsonb,
  add column if not exists pdf_storage_path text;

-- Backfill existing rows: parse client_id by name match (best-effort), default period
-- to created_at::date. user_id was already added by 20260203000001.
update public.reports r
set client_id = c.id
from public.clients c
where r.client_id is null
  and r.client_name is not null
  and lower(r.client_name) = lower(c.name);

update public.reports
set period_from = coalesce(period_from, created_at::date),
    period_to = coalesce(period_to, created_at::date)
where period_from is null or period_to is null;

-- Drop legacy text fields
alter table public.reports drop column if exists period;
alter table public.reports drop column if exists file_size;

-- Indexes for common queries
create index if not exists idx_reports_user_created on public.reports(user_id, created_at desc);
create index if not exists idx_reports_user_client on public.reports(user_id, client_id);
create index if not exists idx_reports_client_id on public.reports(client_id);

comment on column public.reports.snapshot_data is
  'Frozen metrics+chart+automations payload at generation time. Used to render historical reports without re-querying live data.';
comment on column public.reports.pdf_storage_path is
  'Path in Supabase Storage bucket "reports" (format: {user_id}/{report_id}.pdf).';
comment on column public.reports.period_from is 'Date range start covered by the report.';
comment on column public.reports.period_to   is 'Date range end covered by the report.';
