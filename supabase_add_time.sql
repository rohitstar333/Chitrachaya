-- Add event_time to events table to support the 1-hour urgency alerts
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_time time;
