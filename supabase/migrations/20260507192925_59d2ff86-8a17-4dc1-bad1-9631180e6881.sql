-- Immediate heal so the app works right now
UPDATE public.chargers
SET status = 'available',
    ocpp_protocol_status = 'Available',
    last_heartbeat = NOW()
WHERE ocpp_charge_point_id = '140515';

-- Remove any existing cron with same name (idempotent)
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'ocpp-sync-status-every-minute';

-- Schedule auto-sync every minute
SELECT cron.schedule(
  'ocpp-sync-status-every-minute',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fgvjvtglcmxzadetmmoi.supabase.co/functions/v1/ocpp-sync-status',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndmp2dGdsY214emFkZXRtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDkzNTksImV4cCI6MjA3NDgyNTM1OX0.w1jH2DHoWnQwyxpG7HQYie3gMX5XN2GEz_7E7n0p6H0","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZndmp2dGdsY214emFkZXRtbW9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNDkzNTksImV4cCI6MjA3NDgyNTM1OX0.w1jH2DHoWnQwyxpG7HQYie3gMX5XN2GEz_7E7n0p6H0"}'::jsonb,
    body := concat('{"time":"', NOW(), '"}')::jsonb
  );
  $$
);