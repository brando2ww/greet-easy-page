UPDATE public.chargers
SET ocpp_protocol_status = 'Offline'
WHERE id = 'cdbaf312-807c-4bb8-a7ed-90e3fef7565f'
  AND last_heartbeat < now() - interval '3 minutes';