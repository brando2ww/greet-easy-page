
CREATE TABLE public.admin_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  account_id text,
  account_email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.admin_payment_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment configs"
  ON public.admin_payment_config FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payment configs"
  ON public.admin_payment_config FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment configs"
  ON public.admin_payment_config FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment configs"
  ON public.admin_payment_config FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
