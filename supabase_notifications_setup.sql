-- Enable required extensions
create extension if not exists pg_net;
create extension if not exists pg_cron;

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
  -- Fetch the API key securely from Vault
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

-- 2. Trigger 1: New Event Requested
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


-- 3. Trigger 2: Club Access Role Request
create or replace function notify_on_role_request() returns trigger as $$
declare
  lead_ids text[];
  user_name text;
begin
  select array_agg(id::text) into lead_ids from profiles where role in ('Lead', 'SubLead');
  select raw_user_meta_data->>'full_name' into user_name from auth.users where id = NEW.user_id;

  if lead_ids is not null then
    perform public.send_onesignal_push(
      lead_ids,
      'Club Access Requested 🔐',
      coalesce(user_name, 'A user') || ' has requested the ' || NEW.requested_role || ' role.',
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


-- 4. Trigger 3: Peer Task / Coverage Request
create or replace function notify_on_task_request() returns trigger as $$
declare
  event_title text;
  target_uuid text;
begin
  select event_name into event_title from events where id = NEW.event_id;
  
  -- Look up the UUID of the target user by matching their string name
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


-- 5. CRON JOB Function: Scheduled Reminders
create or replace function send_event_reminders() returns void as $$
declare
  unassigned_event record;
  assigned_event record;
  lead_ids text[];
begin
  -- Pre-fetch leads 
  select array_agg(id::text) into lead_ids from profiles where role in ('Lead', 'SubLead', 'Core');

  -- 5a. Alert for UNASSIGNED events starting in < 24 hours
  for unassigned_event in (
    select id, event_name, date from events 
    where status = 'Requested' 
    and date > now() and date <= now() + interval '24 hours'
    and not exists (select 1 from event_assignments where event_id = events.id)
  ) loop
    if lead_ids is not null then
      perform public.send_onesignal_push(
        lead_ids,
        '⚠️ Action Required: Unassigned Event',
        unassigned_event.event_name || ' is starting in less than 24 hours and has no assigned coverage!',
        'https://chitrachaya.vercel.app/club'
      );
    end if;
  end loop;

  -- 5b. Alert for ASSIGNED events starting in < 24 hours
  for assigned_event in (
    select e.id, e.event_name, array_agg(a.user_id::text) as member_ids
    from events e
    join event_assignments a on a.event_id = e.id
    where e.status in ('Assigned', 'Covering')
    and e.date > now() and e.date <= now() + interval '24 hours'
    group by e.id, e.event_name
  ) loop
    if assigned_event.member_ids is not null then
      perform public.send_onesignal_push(
        assigned_event.member_ids,
        '⏰ Reminder: Event Starting Soon',
        'You are assigned to cover ' || assigned_event.event_name || ' within 24 hours!',
        'https://chitrachaya.vercel.app/club'
      );
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Enable the CRON Job safely (run every hour)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('event-reminders-job');
    PERFORM cron.schedule('event-reminders-job', '0 * * * *', 'select public.send_event_reminders()');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if cron schema denies permission, user can add manually in UI
    NULL;
END $$;
