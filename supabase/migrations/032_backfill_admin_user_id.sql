-- Migration 032: Backfill admin user_id on rows missing ownership
-- Purpose: Pre-Clerk-multi-tenancy data has user_id NULL on some rows. Assign
-- it all to Dawid (stepiendawid1@gmail.com) so the existing dashboard keeps
-- showing data after RLS turns strict.
--
-- BEFORE APPLYING: Replace <<DAWID_CLERK_USER_ID>> with Dawid's actual Clerk
-- user id. To find it:
--   Clerk dashboard → Users → stepiendawid1@gmail.com → "User ID" (e.g. user_2abc...)
-- Or via Clerk API:
--   curl https://api.clerk.com/v1/users -H "Authorization: Bearer $CLERK_SECRET_KEY" \
--     | jq '.[] | select(.email_addresses[0].email_address=="stepiendawid1@gmail.com") | .id'

do $$
declare
  admin_id text := '<<DAWID_CLERK_USER_ID>>';  -- TODO: replace before apply
begin
  if admin_id like '<<%>>' then
    raise exception 'You must replace <<DAWID_CLERK_USER_ID>> with Dawid''s Clerk user_id (e.g. user_2abc123) before running this migration.';
  end if;

  update public.automations         set user_id = admin_id where user_id is null or user_id = '';
  update public.clients             set user_id = admin_id where user_id is null or user_id = '';
  update public.reports             set user_id = admin_id where user_id is null or user_id = '';
  update public.executions_raw      set user_id = admin_id where user_id is null or user_id = '';
  update public.app_settings        set user_id = admin_id where user_id is null or user_id = '';
  update public.api_keys            set created_by = admin_id where created_by is null or created_by = '';
end $$;

-- Lock down: every row must now have an owner. Future inserts must pass user_id.
alter table public.automations    alter column user_id set not null;
alter table public.clients        alter column user_id set not null;
alter table public.reports        alter column user_id set not null;
alter table public.executions_raw alter column user_id set not null;
