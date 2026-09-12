-- ==========================================
-- CHITRACHAYA FIX EVENTS RLS POLICIES
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Fix public.events table RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated insert events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated update events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated delete events" ON public.events;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.events;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.events;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.events;
DROP POLICY IF EXISTS "Allow public select events" ON public.events;
DROP POLICY IF EXISTS "Allow public insert events" ON public.events;
DROP POLICY IF EXISTS "Allow public update events" ON public.events;
DROP POLICY IF EXISTS "Allow public delete events" ON public.events;

CREATE POLICY "Allow public select events" ON public.events FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert events" ON public.events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update events" ON public.events FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete events" ON public.events FOR DELETE TO public USING (true);

-- 2. Fix public.camera_requests table RLS
ALTER TABLE public.camera_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow authenticated insert camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow authenticated update camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow public select camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow public insert camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow public update camera_requests" ON public.camera_requests;

CREATE POLICY "Allow public select camera_requests" ON public.camera_requests FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert camera_requests" ON public.camera_requests FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update camera_requests" ON public.camera_requests FOR UPDATE TO public USING (true);

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

