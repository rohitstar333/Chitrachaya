-- FIX 1: Add a policy allowing Leads and SubLeads to Reject/Update role requests
drop policy if exists "Higher roles can update requests" on public.role_requests;
create policy "Higher roles can update requests"
  on public.role_requests for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Lead', 'SubLead', 'Admin', '2nd year')
  );

-- FIX 2: Ensure the policy allowing club members to claim events accommodates edge case role namings
drop policy if exists "Club members can update events" on public.events;
create policy "Club members can update events"
  on public.events for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
  );

-- FIX 3: Update the RPC to allow SubLeads to approve any request (including SubLead/Lead)
create or replace function public.approve_role_request(request_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  req_record record;
  approver_role text;
begin
  -- Get the caller's role
  approver_role := auth.jwt() -> 'user_metadata' ->> 'role';

  -- Find the request
  select * into req_record from public.role_requests where id = request_id;

  if not found then
    raise exception 'Request not found';
  end if;

  if req_record.status != 'Pending' then
    raise exception 'Request is already processed';
  end if;

  -- Allow Lead, SubLead, Admin, or the literal '2nd year' string you might have used
  if approver_role IN ('Lead', 'SubLead', 'Admin', '2nd year') then
    -- Allowed
  else
    raise exception 'Unauthorized: Your role cannot approve this request.';
  end if;

  -- Update the targeted user's raw_user_meta_data to set their new role
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', req_record.requested_role)
  where id = req_record.user_id;

  -- Mark the request as Approved
  update public.role_requests
  set status = 'Approved'
  where id = request_id;
end;
$$;
