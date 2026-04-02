-- Enable required extensions
create extension if not exists pg_net;

-- 1. Helper Function to Send Web Push to OneSignal REST API
create or replace function public.send_onesignal_push(
  user_ids text[],
  heading text,
  content text,
  click_url text default 'https://chitrachaya.vercel.app'
) returns void
language plpgsql
security definer
as $$
declare
  payload json;
  request_id bigint;
  onesignal_api_key text;
begin
  select decrypted_secret into onesignal_api_key 
  from vault.decrypted_secrets 
  where name = 'onesignal_rest_api_key';

  if onesignal_api_key is null then
    raise log 'OneSignal API key not found in vault';
    return;
  end if;

  payload := json_build_object(
    'app_id', 'e4a8d7d7-dba0-4ea9-9bc2-d4f7995e5fda',
    'target_channel', 'push',
    'include_external_user_ids', user_ids,
    'headings', json_build_object('en', heading),
    'contents', json_build_object('en', content),
    'url', click_url
  );

  select net.http_post(
      url:='https://api.onesignal.com/notifications',
      headers:=json_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Basic ' || onesignal_api_key
      )::jsonb,
      body:=payload::jsonb
  ) into request_id;
end;
$$;


-- 2. Trigger: New Event Requested
create or replace function notify_on_new_event() returns trigger as $$
declare
  lead_ids text[];
begin
  select array_agg(id::text) into lead_ids from profiles where role in ('Lead', 'SubLead', 'Core');
  if lead_ids is not null then
    perform public.send_onesignal_push(
      lead_ids,
      'New Event Requested! 📸',
      NEW.event_name || ' is requested for ' || to_char(NEW.date, 'Mon DD, YYYY'),
      'https://chitrachaya.vercel.app/club'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_event on events;
create trigger on_new_event
  after insert on events
  for each row execute function notify_on_new_event();


-- 3. Trigger: Event Status/Progress Changed
create or replace function notify_on_event_update() returns trigger as $$
begin
  if OLD.status IS DISTINCT FROM NEW.status then
    perform public.send_onesignal_push(
      array[NEW.created_by::text],
      'Event Update: ' || NEW.event_name,
      'The status of your event request is now: ' || NEW.status,
      'https://chitrachaya.vercel.app/requester'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_event_update on events;
create trigger on_event_update
  after update on events
  for each row execute function notify_on_event_update();


-- 4. Trigger: New Role Request
create or replace function notify_on_role_request() returns trigger as $$
declare
  lead_ids text[];
begin
  select array_agg(id::text) into lead_ids from profiles where role in ('Lead', 'SubLead');
  if lead_ids is not null then
    perform public.send_onesignal_push(
      lead_ids,
      'Club Access Requested 🔐',
      coalesce(NEW.user_name, 'A user') || ' has requested the ' || NEW.requested_role || ' role.',
      'https://chitrachaya.vercel.app/admin'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_role_request on role_requests;
create trigger on_new_role_request
  after insert on role_requests
  for each row execute function notify_on_role_request();


-- 5. Trigger: Role Request Approved/Rejected
create or replace function notify_on_role_request_update() returns trigger as $$
begin
  if OLD.status IS DISTINCT FROM NEW.status and NEW.status in ('Approved', 'Rejected') then
    perform public.send_onesignal_push(
      array[NEW.user_id::text],
      'Role Request ' || NEW.status,
      'Your request to become ' || NEW.requested_role || ' has been ' || upper(NEW.status) || '!',
      'https://chitrachaya.vercel.app'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_role_request_update on role_requests;
create trigger on_role_request_update
  after update on role_requests
  for each row execute function notify_on_role_request_update();


-- 6. Trigger: Peer Task Request Assigned 
create or replace function notify_on_task_request() returns trigger as $$
declare
  event_title text;
  target_uuid text;
begin
  select event_name into event_title from events where id = NEW.event_id;
  
  select id::text into target_uuid from auth.users 
  where raw_user_meta_data->>'full_name' = NEW.target_user_name limit 1;
  
  if target_uuid is not null then
    perform public.send_onesignal_push(
      array[target_uuid],
      'Coverage Request! 📷',
      'You have been specifically requested to cover ' || coalesce(event_title, 'an event') || ' by ' || coalesce(NEW.requester_name, 'a Lead'),
      'https://chitrachaya.vercel.app/club'
    );
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_new_task_request on task_requests;
create trigger on_new_task_request
  after insert on task_requests
  for each row execute function notify_on_task_request();


-- 7. Trigger: Task Request Accepted/Rejected
create or replace function notify_on_task_request_update() returns trigger as $$
declare
  requester_uuid text;
  event_title text;
begin
  if OLD.status IS DISTINCT FROM NEW.status and NEW.status in ('Accepted', 'Rejected') then
    select event_name into event_title from events where id = NEW.event_id;
    select id::text into requester_uuid from auth.users where raw_user_meta_data->>'full_name' = NEW.requester_name limit 1;

    if requester_uuid is not null then
      perform public.send_onesignal_push(
        array[requester_uuid],
        'Task Request ' || NEW.status || '!',
        NEW.target_user_name || ' has ' || lower(NEW.status) || ' your request for ' || coalesce(event_title, 'the event') || '.',
        'https://chitrachaya.vercel.app/club'
      );
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_request_update on task_requests;
create trigger on_task_request_update
  after update on task_requests
  for each row execute function notify_on_task_request_update();
