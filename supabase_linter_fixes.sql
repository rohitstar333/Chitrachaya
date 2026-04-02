-- 1. Helper Functions to completely banish auth.jwt() user_metadata calls from RLS
create or replace function public.get_auth_role() returns text
language sql security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.get_auth_full_name() returns text
language sql security definer set search_path = public
as $$
  select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid();
$$;


-- 2. Refactor RLS Policies to use the secure helper functions

-- Role Requests Policy
drop policy if exists "Higher roles can update requests" on role_requests;
create policy "Higher roles can update requests" on role_requests
  for update
  using (
    public.get_auth_role() IN ('Lead', 'SubLead', 'Admin', '2nd year')
  );

-- Events Policy
drop policy if exists "Club members can update events" on events;
create policy "Club members can update events" on events
  for update
  using (
    public.get_auth_role() IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
  );

-- Task Requests Policies
drop policy if exists "Club leaders can insert task requests" on task_requests;
create policy "Club leaders can insert task requests" on task_requests
  for insert
  with check (
    public.get_auth_role() IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
  );

drop policy if exists "Users can update task requests" on task_requests;
create policy "Users can update task requests" on task_requests
  for update
  using (
    public.get_auth_full_name() = target_user_name OR
    public.get_auth_role() IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
  );


-- 3. Fix "Function Search Path Mutable" (WARN) by locking them to the "public" schema

alter function public.notify_on_task_request() set search_path = public;

alter function public.notify_on_task_request_update() set search_path = public;

alter function public.sync_profile_from_auth_users() set search_path = public;

alter function public.approve_role_request(uuid) set search_path = public;

-- Handle elevate_to_admin if it exists with (uuid)
do $$
begin
  if exists (select 1 from pg_proc where proname = 'elevate_to_admin') then
    alter function public.elevate_to_admin(uuid) set search_path = public;
  end if;
end $$;

alter function public.send_onesignal_push(text[], text, text, text) set search_path = public;

alter function public.notify_on_new_event() set search_path = public;

alter function public.notify_on_event_update() set search_path = public;

alter function public.notify_on_role_request() set search_path = public;

alter function public.notify_on_role_request_update() set search_path = public;
