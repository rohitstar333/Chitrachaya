-- ==========================================
-- CHITRACHAYA FIX EVENTS RLS POLICIES
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Enable RLS on public.events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 2. Drop old/restrictive policies if existing
DROP POLICY IF EXISTS "Allow authenticated read events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated insert events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated update events" ON public.events;
DROP POLICY IF EXISTS "Allow authenticated delete events" ON public.events;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.events;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.events;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.events;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.events;

-- 3. Create RLS policies allowing all logged-in users to request & manage events
CREATE POLICY "Allow authenticated read events"
    ON public.events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert events"
    ON public.events FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update events"
    ON public.events FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete events"
    ON public.events FOR DELETE
    TO authenticated
    USING (true);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
