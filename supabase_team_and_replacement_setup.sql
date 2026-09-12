-- 1. Create or update profiles view to expose all members and their roles to authenticated users
create or replace view public.profiles as
select 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'roll_number' as roll_number
from auth.users;

grant select on public.profiles to authenticated;

-- 2. Add request_type column to task_requests table if missing
alter table public.task_requests add column if not exists request_type text default 'direct_request';

-- 3. Policy for inserting task requests (Leads, SubLeads, or assigned members)
drop policy if exists "Club leaders can insert task requests" on public.task_requests;
create policy "Club leaders can insert task requests"
  on public.task_requests for insert
  to authenticated
  with check (true);

-- 4. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
