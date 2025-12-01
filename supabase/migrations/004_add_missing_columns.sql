-- Add missing columns to leads table

ALTER TABLE leads ADD COLUMN IF NOT EXISTS trade_in JSONB DEFAULT '{}'::jsonb;

-- Also add any other missing columns that might be needed
-- (checking common fields from the form)

