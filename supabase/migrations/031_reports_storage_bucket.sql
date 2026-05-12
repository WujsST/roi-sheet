-- Migration 031: Storage bucket "reports" + RLS for owner-only PDF access
-- Path convention: {user_id}/{report_id}.pdf
-- The first folder segment must equal the caller's Clerk user_id.

-- Create bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- Drop old policies if they exist to keep this idempotent
drop policy if exists "owner reads own report pdfs" on storage.objects;
drop policy if exists "owner writes own report pdfs" on storage.objects;
drop policy if exists "owner updates own report pdfs" on storage.objects;
drop policy if exists "owner deletes own report pdfs" on storage.objects;

create policy "owner reads own report pdfs"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy "owner writes own report pdfs"
  on storage.objects for insert
  with check (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy "owner updates own report pdfs"
  on storage.objects for update
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );

create policy "owner deletes own report pdfs"
  on storage.objects for delete
  using (
    bucket_id = 'reports'
    and (storage.foldername(name))[1] = (auth.jwt() ->> 'sub')
  );
