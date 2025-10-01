-- Create enum for charger status
CREATE TYPE charger_status AS ENUM ('available', 'in_use', 'maintenance', 'offline');

-- Create chargers table
CREATE TABLE public.chargers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  power NUMERIC NOT NULL CHECK (power > 0),
  connector_type TEXT NOT NULL,
  status charger_status NOT NULL DEFAULT 'available',
  price_per_kwh NUMERIC NOT NULL CHECK (price_per_kwh >= 0),
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chargers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can view all chargers
CREATE POLICY "Admins can view all chargers"
ON public.chargers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert chargers
CREATE POLICY "Admins can insert chargers"
ON public.chargers
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update chargers
CREATE POLICY "Admins can update chargers"
ON public.chargers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete chargers
CREATE POLICY "Admins can delete chargers"
ON public.chargers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_chargers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chargers_updated_at
BEFORE UPDATE ON public.chargers
FOR EACH ROW
EXECUTE FUNCTION public.update_chargers_updated_at();

-- Create index for faster queries
CREATE INDEX idx_chargers_status ON public.chargers(status);
CREATE INDEX idx_chargers_location ON public.chargers(location);