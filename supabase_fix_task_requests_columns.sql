-- Add potentially missing columns to task_requests table if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'task_requests' and column_name = 'requester_id') then
    alter table public.task_requests add column requester_id uuid references auth.users;
  end if;

  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'task_requests' and column_name = 'requester_name') then
    alter table public.task_requests add column requester_name text;
  end if;
end $$;

-- Reload postgrest schema
NOTIFY pgrst, 'reload schema';
