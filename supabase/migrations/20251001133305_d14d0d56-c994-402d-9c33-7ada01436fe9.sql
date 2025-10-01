-- First, insert sample chargers
INSERT INTO public.chargers (name, location, latitude, longitude, connector_type, power, price_per_kwh, status)
VALUES 
  ('Carregador Centro #1', 'Shopping Center - São Paulo', -23.5505, -46.6333, 'CCS2', 150, 0.89, 'available'),
  ('Carregador Centro #2', 'Shopping Center - São Paulo', -23.5505, -46.6333, 'CHAdeMO', 50, 0.79, 'available'),
  ('Carregador Paulista #1', 'Av. Paulista - São Paulo', -23.5629, -46.6544, 'CCS2', 150, 0.92, 'available'),
  ('Carregador Morumbi #1', 'Shopping Morumbi - São Paulo', -23.6275, -46.6984, 'Type 2', 22, 0.65, 'available'),
  ('Carregador Itaim #1', 'Itaim Bibi - São Paulo', -23.5847, -46.6789, 'CCS2', 150, 0.95, 'in_use'),
  ('Carregador Vila Olimpia #1', 'Vila Olimpia - São Paulo', -23.5969, -46.6896, 'CCS2', 100, 0.85, 'available'),
  ('Carregador Pinheiros #1', 'Pinheiros - São Paulo', -23.5670, -46.6890, 'Type 2', 22, 0.68, 'maintenance'),
  ('Carregador Jardins #1', 'Jardins - São Paulo', -23.5680, -46.6560, 'CCS2', 150, 0.98, 'available');

-- Create charging_sessions table
CREATE TABLE public.charging_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  charger_id UUID NOT NULL REFERENCES public.chargers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  energy_consumed NUMERIC(10, 2),
  cost NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  vehicle_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions"
  ON public.charging_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.charging_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON public.charging_sessions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all sessions"
  ON public.charging_sessions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete sessions"
  ON public.charging_sessions
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_charging_sessions_updated_at
  BEFORE UPDATE ON public.charging_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chargers_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_charging_sessions_user_id ON public.charging_sessions(user_id);
CREATE INDEX idx_charging_sessions_charger_id ON public.charging_sessions(charger_id);
CREATE INDEX idx_charging_sessions_started_at ON public.charging_sessions(started_at DESC);
CREATE INDEX idx_charging_sessions_status ON public.charging_sessions(status);

-- Insert sample charging sessions (last 14 days)
INSERT INTO public.charging_sessions (charger_id, user_id, started_at, ended_at, energy_consumed, cost, status, vehicle_info)
SELECT 
  c.id as charger_id,
  p.id as user_id,
  NOW() - (random() * INTERVAL '14 days') as started_at,
  NOW() - (random() * INTERVAL '14 days') + INTERVAL '2 hours' as ended_at,
  (random() * 50 + 10)::numeric(10,2) as energy_consumed,
  (random() * 150 + 30)::numeric(10,2) as cost,
  CASE WHEN random() > 0.1 THEN 'completed' ELSE 'cancelled' END as status,
  CASE 
    WHEN random() > 0.7 THEN 'Tesla Model 3'
    WHEN random() > 0.4 THEN 'Nissan Leaf'
    ELSE 'Chevrolet Bolt'
  END as vehicle_info
FROM 
  (SELECT id FROM public.chargers ORDER BY random() LIMIT 1) c,
  (SELECT id FROM public.profiles ORDER BY random() LIMIT 1) p,
  generate_series(1, 50);