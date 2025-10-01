-- Add new columns to chargers table
ALTER TABLE chargers ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE chargers ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Set default value for price_per_kwh if needed
ALTER TABLE chargers ALTER COLUMN price_per_kwh SET DEFAULT 0.80;

-- Create index for better performance on client queries
CREATE INDEX IF NOT EXISTS idx_chargers_client_id ON chargers(client_id);