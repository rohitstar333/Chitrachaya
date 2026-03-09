-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create events table
create table public.events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  club_name text not null,
  date date not null,
  venue text not null,
  coverage_type text not null,
  photographer text,
  uploader text,
  status text default 'Requested',
  drive_link text,
  mail_sent boolean default false,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.events enable row level security;

-- Policy: Event Requester can insert events
create policy "Event Requesters can insert events"
  on public.events for insert
  to authenticated
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Event Requester');

-- Policy: All authenticated users can view all events
create policy "Authenticated users can view all events"
  on public.events for select
  to authenticated
  using (true);

-- Policy: Admins can update events
create policy "Admins can update events"
  on public.events for update
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');

-- Also allow Admin to insert, just in case
create policy "Admins can insert events"
  on public.events for insert
  to authenticated
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'Admin');
