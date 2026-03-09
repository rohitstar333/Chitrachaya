-- Drop the old table completely to wipe the incompatible schema
drop table if exists public.task_requests cascade;

-- Recreate the table with exactly the columns the application expects
create table public.task_requests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events on delete cascade not null,
  requester_id uuid references auth.users not null,
  requester_name text not null,
  target_user_name text not null,
  role_type text not null, -- 'photographer' or 'uploader'
  status text default 'Pending', -- 'Pending', 'Accepted', 'Rejected'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Re-enable Row Level Security
alter table public.task_requests enable row level security;

-- Re-apply policies
create policy "Club leaders can insert task requests"
  on public.task_requests for insert
  to authenticated
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
  );

create policy "Everyone can view task requests"
  on public.task_requests for select
  to authenticated
  using (true);

create policy "Users can update task requests"
  on public.task_requests for update
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'full_name') = target_user_name OR
    auth.uid() = requester_id
  );

-- Reload postgrest schema so the frontend API immediately sees the fresh table!
NOTIFY pgrst, 'reload schema';
