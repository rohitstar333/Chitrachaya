-- FIX 4: Explicitly allow Event Requesters to insert into the role_requests table
-- The previous policy created ("Users can request access") checked auth.uid() = user_id but might have had an issue with the actual Role payload or lacking explicit insert grants. Let's make sure it's broad enough.

drop policy if exists "Users can request access" on public.role_requests;
create policy "Users can request access"
  on public.role_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Also ensure Event Requesters are allowed to READ the role_requests so the `existing` check in the component doesn't fail silently or get blocked.
drop policy if exists "Users can view own requests" on public.role_requests;
create policy "Users can view own requests"
  on public.role_requests for select
  to authenticated
  using (auth.uid() = user_id);
