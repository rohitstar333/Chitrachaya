-- MEGA SETUP SCRIPT FOR NEW SUPABASE PROJECT

-- ==========================================
-- START OF supabase_schema.sql
-- ==========================================

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


-- ==========================================
-- START OF supabase_extended_schema.sql
-- ==========================================

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


-- ==========================================
-- START OF supabase_role_requests.sql
-- ==========================================

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


-- ==========================================
-- START OF supabase_recreate_task_requests.sql
-- ==========================================

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


-- ==========================================
-- START OF supabase_add_time.sql
-- ==========================================

-- Add event_time to events table to support the 1-hour urgency alerts
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time time;


-- ==========================================
-- START OF supabase_add_additional_info.sql
-- ==========================================

alter table public.events add column if not exists additional_info text;


-- ==========================================
-- START OF supabase_security_remediation.sql
-- ==========================================

-- supabase_security_remediation.sql
-- Idempotent remediation script for Supabase Advisor findings.
--
-- Covers:
-- 1) Function search_path hardening
-- 2) Move pg_net extension out of public
-- 3) Replace public.profiles view (auth.users exposure) with a real table + sync trigger
-- 4) RLS enablement and policy cleanup for event_assignments/events/role_requests/task_requests
--
-- Manual step still required (not SQL):
-- Supabase Dashboard -> Authentication -> Settings -> enable "Leaked password protection".

create extension if not exists "uuid-ossp";
create schema if not exists extensions;

-- -----------------------------------------------------------------------------
-- 1) Harden function search_path for existing security definer / trigger funcs
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regprocedure('public.elevate_to_admin(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.elevate_to_admin(uuid) SET search_path = public, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.approve_role_request(uuid)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.approve_role_request(uuid) SET search_path = public, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.send_onesignal_push(text[],text,text,text)') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.send_onesignal_push(text[],text,text,text) SET search_path = public, vault, net, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.notify_on_new_event()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.notify_on_new_event() SET search_path = public, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.notify_on_role_request()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.notify_on_role_request() SET search_path = public, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.notify_on_task_request()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.notify_on_task_request() SET search_path = public, auth, pg_temp';
  END IF;

  IF to_regprocedure('public.send_event_reminders()') IS NOT NULL THEN
    EXECUTE 'ALTER FUNCTION public.send_event_reminders() SET search_path = public, auth, pg_temp';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 2) Keep pg_net extension out of public schema
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  ext_schema text;
BEGIN
  SELECT n.nspname
  INTO ext_schema
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  WHERE e.extname = 'pg_net';

  IF ext_schema IS NULL THEN
    BEGIN
      EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions';
    EXCEPTION
      WHEN feature_not_supported OR invalid_parameter_value THEN
        -- Some pg_net builds do not allow schema override.
        EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_net';
    END;
  ELSIF ext_schema = 'public' THEN
    BEGIN
      EXECUTE 'ALTER EXTENSION pg_net SET SCHEMA extensions';
    EXCEPTION
      WHEN feature_not_supported THEN
        -- pg_net can be non-relocatable; keep script idempotent and continue.
        RAISE NOTICE 'pg_net extension is non-relocatable in this environment; skipping SET SCHEMA.';
    END;
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- 3) Replace exposed auth.users view with secure public.profiles table
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'profiles'
  ) THEN
    EXECUTE 'DROP VIEW public.profiles';
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.profiles ADD PRIMARY KEY (id);
  END IF;
END
$$;

INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'full_name', u.email),
  u.raw_user_meta_data ->> 'role',
  timezone('utc'::text, now()),
  timezone('utc'::text, now())
FROM auth.users u
ON CONFLICT (id)
DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = timezone('utc'::text, now());

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_users()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.raw_user_meta_data ->> 'role',
    COALESCE(NEW.created_at, timezone('utc'::text, now())),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_changed_sync_profile ON auth.users;
CREATE TRIGGER on_auth_user_changed_sync_profile
AFTER INSERT OR UPDATE OF raw_user_meta_data, email
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_from_auth_users();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

GRANT SELECT ON public.profiles TO authenticated;

-- -----------------------------------------------------------------------------
-- 4) RLS cleanup: event_assignments/events/role_requests/task_requests
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.event_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event assignments are viewable by authenticated users" ON public.event_assignments;
CREATE POLICY "Event assignments are viewable by authenticated users"
  ON public.event_assignments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Privileged users can insert assignments" ON public.event_assignments;
CREATE POLICY "Privileged users can insert assignments"
  ON public.event_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
    )
  );

DROP POLICY IF EXISTS "Owners or privileged users can update assignments" ON public.event_assignments;
CREATE POLICY "Owners or privileged users can update assignments"
  ON public.event_assignments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
    )
  );

DROP POLICY IF EXISTS "Owners or privileged users can delete assignments" ON public.event_assignments;
CREATE POLICY "Owners or privileged users can delete assignments"
  ON public.event_assignments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
    )
  );

-- Events policies
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event Requesters can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Club members can update events" ON public.events;

CREATE POLICY "Authenticated users can view all events"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can insert events"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Event Requester', 'Admin')
    )
  );

CREATE POLICY "Club members can update events"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Core', 'SubLead', 'Lead', 'Admin', '2nd year', '3rd year')
    )
  );

-- role_requests policies
ALTER TABLE IF EXISTS public.role_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can request access" ON public.role_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON public.role_requests;
DROP POLICY IF EXISTS "Higher roles can view requests" ON public.role_requests;
DROP POLICY IF EXISTS "Higher roles can update requests" ON public.role_requests;

CREATE POLICY "Users can request access"
  ON public.role_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests"
  ON public.role_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Higher roles can view requests"
  ON public.role_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year')
    )
  );

CREATE POLICY "Higher roles can update requests"
  ON public.role_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year')
    )
  );

-- task_requests policies
ALTER TABLE IF EXISTS public.task_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Club leaders can insert task requests" ON public.task_requests;
DROP POLICY IF EXISTS "Everyone can view task requests" ON public.task_requests;
DROP POLICY IF EXISTS "Users can update task requests" ON public.task_requests;

CREATE POLICY "Club leaders can insert task requests"
  ON public.task_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Lead', 'SubLead', 'Admin', '2nd year', '3rd year')
    )
  );

CREATE POLICY "Everyone can view task requests"
  ON public.task_requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update task requests"
  ON public.task_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.full_name = target_user_name
    )
  )
  WITH CHECK (
    auth.uid() = requester_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.full_name = target_user_name
    )
  );

-- Refresh PostgREST schema cache for immediate API reflection.
NOTIFY pgrst, 'reload schema';


-- ==========================================
-- START OF supabase_final_fixes.sql
-- ==========================================

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


