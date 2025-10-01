-- Create clients table for partner establishments
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cnpj TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better search performance
CREATE INDEX idx_clients_company_name ON public.clients(company_name);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_city ON public.clients(city);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients table
CREATE POLICY "Admins can view all clients"
ON public.clients
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert clients"
ON public.clients
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clients"
ON public.clients
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add partner_client_id to chargers table (keeping old client_id for compatibility)
ALTER TABLE public.chargers 
ADD COLUMN partner_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX idx_chargers_partner_client_id ON public.chargers(partner_client_id);

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_chargers_updated_at();