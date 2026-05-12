-- Migration 034: seed Dawid jako admin
-- BEFORE APPLYING: Replace <<DAWID_CLERK_USER_ID>> with Dawid's actual Clerk user_id
-- (np. user_2abc...). Z Clerk dashboard → Users → stepiendawid1@gmail.com → "User ID".

do $$
declare
  admin_id text := '<<DAWID_CLERK_USER_ID>>';
begin
  if admin_id like '<<%>>' then
    raise exception 'You must replace <<DAWID_CLERK_USER_ID>> with Dawid''s Clerk user_id before running this migration.';
  end if;

  insert into public.admin_users (user_id) values (admin_id) on conflict do nothing;
end $$;
