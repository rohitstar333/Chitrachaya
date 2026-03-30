-- Clear all event assignments and requests first due to foreign key constraints, then clear events
DELETE FROM public.event_assignments;
DELETE FROM public.task_requests;
DELETE FROM public.events;
