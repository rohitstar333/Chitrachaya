-- Run this SQL in your Supabase SQL Editor to make your account a Lead:
-- Replace 'your.email@iiitkottayam.ac.in' with your actual login email address!

UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "Lead"}'::jsonb 
WHERE email = 'your.email@iiitkottayam.ac.in';

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
