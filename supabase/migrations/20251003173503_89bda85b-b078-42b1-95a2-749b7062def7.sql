-- Create wallet_balances table
CREATE TABLE public.wallet_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_balances
CREATE POLICY "Users can view own wallet balance"
  ON public.wallet_balances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallet balance"
  ON public.wallet_balances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet balance"
  ON public.wallet_balances
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallet balances"
  ON public.wallet_balances
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_wallet_balances_updated_at
  BEFORE UPDATE ON public.wallet_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_billing_info_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_wallet_balances_user_id ON public.wallet_balances(user_id);