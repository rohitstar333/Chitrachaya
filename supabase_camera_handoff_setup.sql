-- ==========================================
-- CHITRACHAYA IT CAMERA HANDOFF & DIGITAL ID SETUP
-- Run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create camera_requests table if it does not exist
CREATE TABLE IF NOT EXISTS public.camera_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    requester_roll TEXT DEFAULT 'N/A',
    assignee_phone TEXT NOT NULL,
    lead_phone TEXT NOT NULL,
    equipment_details TEXT DEFAULT 'DSLR Camera Body + Kit Lens',
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Returned', 'Rejected')),
    approved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.camera_requests ENABLE ROW LEVEL SECURITY;

-- Drop old policies if existing
DROP POLICY IF EXISTS "Allow authenticated read camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow authenticated insert camera_requests" ON public.camera_requests;
DROP POLICY IF EXISTS "Allow authenticated update camera_requests" ON public.camera_requests;

-- Create policies for camera_requests
CREATE POLICY "Allow authenticated read camera_requests"
    ON public.camera_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated insert camera_requests"
    ON public.camera_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated update camera_requests"
    ON public.camera_requests FOR UPDATE
    TO authenticated
    USING (true);

-- 2. Update change_member_role RPC to support IT role strictly for Lead
CREATE OR REPLACE FUNCTION public.change_member_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    caller_role TEXT;
    target_current_meta JSONB;
    updated_meta JSONB;
BEGIN
    -- Verify caller is logged in
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get caller role from user_metadata
    SELECT (raw_user_meta_data->>'role') INTO caller_role
    FROM auth.users
    WHERE id = auth.uid();

    IF caller_role IS NULL THEN
        caller_role := 'Event Requester';
    END IF;

    -- Strict permission check for IT role
    IF new_role = 'IT' AND caller_role NOT IN ('Lead', 'Admin', '3rd year') THEN
        RAISE EXCEPTION 'Only Lead can assign IT Server Room Staff role.';
    END IF;

    -- Role permission check
    IF caller_role IN ('Lead', 'Admin', '3rd year') THEN
        IF new_role NOT IN ('Lead', 'SubLead', 'Core', 'Event Requester', 'IT') THEN
            RAISE EXCEPTION 'Invalid target role for Lead.';
        END IF;
    ELSIF caller_role IN ('SubLead') THEN
        IF new_role NOT IN ('Core') THEN
            RAISE EXCEPTION 'SubLeads can only promote members to Core.';
        END IF;
    ELSE
        RAISE EXCEPTION 'Only Leads and SubLeads can modify member roles.';
    END IF;

    -- Fetch existing target metadata
    SELECT raw_user_meta_data INTO target_current_meta
    FROM auth.users
    WHERE id = target_user_id;

    IF target_current_meta IS NULL THEN
        target_current_meta := '{}'::jsonb;
    END IF;

    -- Update role in metadata
    updated_meta := target_current_meta || jsonb_build_object('role', new_role);

    UPDATE auth.users
    SET raw_user_meta_data = updated_meta
    WHERE id = target_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Role updated successfully to ' || new_role);
END;
$$;

NOTIFY pgrst, 'reload schema';
