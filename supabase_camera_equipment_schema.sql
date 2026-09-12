-- Create Camera Equipment Requests table for IT Server Room tracking
create table if not exists public.camera_requests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events on delete cascade not null,
  requester_id uuid references auth.users not null,
  assignee_name text not null,
  assignee_roll_number text,
  assignee_phone text not null,
  lead_phone text not null,
  camera_details text default 'Standard Camera Kit',
  status text default 'Requested', -- 'Requested', 'Checked Out', 'Returned', 'Rejected'
  issued_by text,
  issued_at timestamp with time zone,
  returned_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.camera_requests enable row level security;

-- RLS policies
drop policy if exists "Authenticated users can view camera requests" on public.camera_requests;
create policy "Authenticated users can view camera requests"
  on public.camera_requests for select
  to authenticated
  using (true);

drop policy if exists "Club members can request camera equipment" on public.camera_requests;
create policy "Club members can request camera equipment"
  on public.camera_requests for insert
  to authenticated
  with check (true);

drop policy if exists "IT and Leads can update camera requests" on public.camera_requests;
create policy "IT and Leads can update camera requests"
  on public.camera_requests for update
  to authenticated
  using (true);

-- Update change_member_role function to allow assigning IT role
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
    if new_role in ('Lead', 'SubLead', 'Core', 'Event Requester', 'IT') then
      update auth.users
      set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', new_role)
      where id = target_user_id;
    else
      raise exception 'Invalid role.';
    end if;
  else
    raise exception 'Unauthorized to change member roles.';
  end if;
end;
$$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
