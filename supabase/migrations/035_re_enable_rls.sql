-- Migration 035: Re-enable RLS po dropach/creates w 028 + 033 + 029
-- Powód: w niektórych ścieżkach `drop policy + create policy` powodował że
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY znikał. Plus system_logs i
-- savings_history nigdy nie miały RLS (legacy). Tutaj wszystko spina się w jedno.

alter table public.automations    enable row level security;
alter table public.clients        enable row level security;
alter table public.reports        enable row level security;
alter table public.executions_raw enable row level security;
alter table public.app_settings   enable row level security;
alter table public.api_keys       enable row level security;
alter table public.system_logs    enable row level security;
alter table public.savings_history enable row level security;

-- system_logs i savings_history nie mają user_id (legacy global) — dostęp tylko admin
drop policy if exists system_logs_admin on public.system_logs;
create policy system_logs_admin on public.system_logs for all using (public.is_admin());

drop policy if exists savings_history_admin on public.savings_history;
create policy savings_history_admin on public.savings_history for all using (public.is_admin());

-- Fix: current_org_id miał mutable search_path (advisor lint 0011)
create or replace function public.current_org_id() returns text
language sql stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'org_id', '');
$$;
