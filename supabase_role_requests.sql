-- Drop the old admin requests table if it exists
drop table if exists public.admin_requests cascade;

-- Create role_requests table
create table public.role_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  requested_role text not null, -- 'Core', 'SubLead', 'Lead'
  status text default 'Pending', -- 'Pending', 'Approved', 'Rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.role_requests enable row level security;

-- Policy: Users can insert their own request
create policy "Users can request access"
  on public.role_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can view their own requests
create policy "Users can view own requests"
  on public.role_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: SubLeads and Leads can view all requests
create policy "Higher roles can view requests"
  on public.role_requests for select
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'Lead' or 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'SubLead'
  );

-- Function to safely approve a role request via Postgres RPC
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

  -- Verify permissions:
  -- Leads can approve ANY role (Core, SubLead, Lead).
  -- SubLeads can ONLY approve Core requests.
  if approver_role = 'Lead' then
    -- Allowed
  elsif approver_role = 'SubLead' and req_record.requested_role = 'Core' then
    -- Allowed
  else
    raise exception 'Unauthorized: Your role cannot approve this request level.';
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
