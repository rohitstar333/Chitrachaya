-- Create admin_requests table
create table public.admin_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  status text default 'Pending', -- Pending, Approved, Rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.admin_requests enable row level security;

-- Policy: Anyone logged in can insert their own request
create policy "Users can request admin access"
  on public.admin_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Policy: Users can view their own requests
create policy "Users can view own requests"
  on public.admin_requests for select
  to authenticated
  using (auth.uid() = user_id);

-- Policy: Admins can view all requests
create policy "Admins can view all requests"
  on public.admin_requests for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Policy: Admins can update requests
create policy "Admins can update requests"
  on public.admin_requests for update
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');
