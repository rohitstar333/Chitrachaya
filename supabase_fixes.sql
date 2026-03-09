-- Add user_name to role_requests to avoid showing user_id
ALTER TABLE public.role_requests ADD COLUMN IF NOT EXISTS user_name text;

-- Add RLS policy to allow Club Members (Core, SubLead, Lead) to update events
-- This enables the "Tick to Claim" feature
CREATE POLICY "Club members can update events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Core', 'SubLead', 'Lead')
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Core', 'SubLead', 'Lead')
  );
