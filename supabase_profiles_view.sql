-- Create a secure view for the application to see other users
create or replace view public.profiles as
select 
  id,
  raw_user_meta_data->>'full_name' as full_name,
  raw_user_meta_data->>'role' as role
from auth.users
where raw_user_meta_data->>'role' is not null
  and raw_user_meta_data->>'role' != 'Event Requester';

-- Grant access to the authenticated role
grant select on public.profiles to authenticated;
