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
