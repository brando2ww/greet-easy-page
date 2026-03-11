
-- Create meter_values table for storing OCPP meter readings
CREATE TABLE public.meter_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.charging_sessions(id) ON DELETE CASCADE,
  transaction_id integer,
  timestamp timestamptz NOT NULL DEFAULT now(),
  connector_id integer,
  measurand text NOT NULL DEFAULT 'Energy.Active.Import.Register',
  value numeric NOT NULL,
  unit text NOT NULL DEFAULT 'Wh',
  phase text,
  context text DEFAULT 'Sample.Periodic',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meter_values ENABLE ROW LEVEL SECURITY;

-- Admin can view all meter values
CREATE POLICY "Admins can view all meter values"
  ON public.meter_values FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can insert meter values (via edge functions with service role)
CREATE POLICY "Admins can insert meter values"
  ON public.meter_values FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view meter values from their own sessions
CREATE POLICY "Users can view own session meter values"
  ON public.meter_values FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charging_sessions cs
      WHERE cs.id = meter_values.session_id
      AND cs.user_id = auth.uid()
    )
  );

-- Allow service role full access (for OCPP server inserts)
CREATE POLICY "Service role full access to meter values"
  ON public.meter_values FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_meter_values_session_id ON public.meter_values(session_id);
CREATE INDEX idx_meter_values_transaction_id ON public.meter_values(transaction_id);
