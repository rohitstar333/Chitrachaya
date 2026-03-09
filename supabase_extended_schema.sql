-- Note: events table already exists from previous setup.
-- If you need to add columns to it, use ALTER TABLE.

-- Event assignments table to allow Core & SubLeads to assign themselves
create table public.event_assignments (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events on delete cascade not null,
  user_id uuid references auth.users not null,
  role_type text not null, -- 'Photographer' or 'Editor', etc.
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Task requests table for SubLeads (2nd years) to request Core (1st years)
create table public.task_requests (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references public.events on delete cascade not null,
  sublead_id uuid references auth.users not null, -- The 2nd year requesting
  core_id uuid references auth.users not null, -- The 1st year being requested
  task_description text not null,
  status text default 'Pending', -- Pending, Accepted, Rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies follow...
