-- Create billing_info table
CREATE TABLE public.billing_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  cpf text,
  street_address text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.billing_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own billing info"
  ON public.billing_info
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own billing info"
  ON public.billing_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own billing info"
  ON public.billing_info
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all billing info"
  ON public.billing_info
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_billing_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_billing_info_updated_at
  BEFORE UPDATE ON public.billing_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_billing_info_updated_at();