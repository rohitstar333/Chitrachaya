-- Add potentially missing role_type column to task_requests table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'task_requests' and column_name = 'role_type') then
    alter table public.task_requests add column role_type text;
  end if;
end $$;

-- Reload postgrest schema so the frontend API immediately sees the column!
NOTIFY pgrst, 'reload schema';
