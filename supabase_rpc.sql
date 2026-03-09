-- Function to elevate a user to Admin safely via Postgres RPC
create or replace function public.elevate_to_admin(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- First verify that the caller is an Admin
  if (auth.jwt() -> 'user_metadata' ->> 'role') != 'Admin' then
    raise exception 'Unauthorized: Only Admins can elevate roles.';
  end if;

  -- Update the raw_user_meta_data to set the role to Admin
  update auth.users
  set raw_user_meta_data = raw_user_meta_data || '{"role":"Admin"}'::jsonb
  where id = target_user_id;

  -- Update the request status to Approved
  update public.admin_requests
  set status = 'Approved'
  where user_id = target_user_id;
end;
$$;
