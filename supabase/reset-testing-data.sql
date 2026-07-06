-- Run this in Supabase SQL Editor when you want to clear testing registrations.
-- It removes participant records, uploaded run proof records, and resets event timing.

delete from run_submissions;
delete from registrations;

update event_settings
set
  registration_opens_at = '2026-07-07 16:00:00+07',
  registration_closes_at = '2026-07-31 11:59:00+07'
where id = 1;
