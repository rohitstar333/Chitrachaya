-- 1. Ensure the user_name column actually exists (in case the previous script wasn't fully applied)
ALTER TABLE public.role_requests ADD COLUMN IF NOT EXISTS user_name text;

-- 2. Force Supabase to reload its API schema cache 
-- This fixes the "Could not find the 'user_name' column in the schema cache" error
NOTIFY pgrst, 'reload schema';
