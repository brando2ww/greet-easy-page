-- Add awaiting_plug to allowed statuses
ALTER TABLE charging_sessions DROP CONSTRAINT IF EXISTS charging_sessions_status_check;
ALTER TABLE charging_sessions ADD CONSTRAINT charging_sessions_status_check
  CHECK (status = ANY (ARRAY['in_progress', 'completed', 'cancelled', 'awaiting_plug']));

-- Allow started_at to be null (for awaiting_plug sessions)
ALTER TABLE charging_sessions ALTER COLUMN started_at DROP NOT NULL;