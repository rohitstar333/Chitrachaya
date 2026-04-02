-- 1. Add end_time to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time text;

-- 2. Allow Leads and SubLeads to delete events
-- Use existing helper function to check role or create if not exists
CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS text
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "Leads and SubLeads can delete events" ON public.events;
CREATE POLICY "Leads and SubLeads can delete events" ON public.events
  FOR DELETE
  USING (
    public.get_auth_role() IN ('Lead', 'SubLead', 'Admin')
  );

-- 3. Update task request trigger to ensure it notifies on Rejection
CREATE OR REPLACE FUNCTION notify_on_task_request_update() RETURNS trigger AS $$
DECLARE
  requester_uuid text;
  event_title text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Accepted', 'Rejected') THEN
    SELECT event_name INTO event_title FROM events WHERE id = NEW.event_id;
    SELECT id::text INTO requester_uuid FROM auth.users WHERE raw_user_meta_data->>'full_name' = NEW.requester_name LIMIT 1;

    IF requester_uuid IS NOT NULL THEN
      PERFORM public.send_onesignal_push(
        ARRAY[requester_uuid],
        'Task Request ' || NEW.status || '!',
        NEW.target_user_name || ' has ' || lower(NEW.status) || ' your request for ' || coalesce(event_title, 'the event') || '.',
        'https://chitrachaya.vercel.app/club'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_task_request_update ON task_requests;
CREATE TRIGGER on_task_request_update
  AFTER UPDATE ON task_requests
  FOR EACH ROW EXECUTE FUNCTION notify_on_task_request_update();
