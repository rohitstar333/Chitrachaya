-- 1. Drop existing table or view if present so it replaces cleanly
drop table if exists public.profiles cascade;
drop view if exists public.profiles cascade;

-- 2. Re-create public.profiles view
create view public.profiles as
select 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'roll_number' as roll_number
from auth.users;

grant select on public.profiles to authenticated;

-- 3. Add request_type column to task_requests table if missing
alter table public.task_requests add column if not exists request_type text default 'direct_request';

-- 4. Policy for inserting task requests
drop policy if exists "Club leaders can insert task requests" on public.task_requests;
create policy "Club leaders can insert task requests"
  on public.task_requests for insert
  to authenticated
  with check (true);

-- 5. RPC function to allow Leads/SubLeads to directly change a member's role
create or replace function public.change_member_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
as $$
declare
  caller_role text;
begin
  caller_role := auth.jwt() -> 'user_metadata' ->> 'role';

  if caller_role in ('Lead', 'Admin', '3rd year') then
    -- Leads can change roles to Lead, SubLead, Core, or Event Requester
    if new_role in ('Lead', 'SubLead', 'Core', 'Event Requester') then
      update auth.users
      set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
      where id = target_user_id;
    else
      raise exception 'Invalid role.';
    end if;

  elsif caller_role in ('SubLead', '2nd year') then
    -- SubLeads can promote to Core
    if new_role = 'Core' then
      update auth.users
      set raw_user_meta_data = raw_user_meta_data || '{"role": "Core"}'::jsonb
      where id = target_user_id;
    else
      raise exception 'SubLeads can only promote members to Core.';
    end if;

  else
    raise exception 'Unauthorized to change member roles.';
  end if;
end;
$$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
