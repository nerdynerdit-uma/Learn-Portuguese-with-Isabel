-- Quick Fix: Add missing columns to existing tables
-- Run this if you get "column does not exist" errors

-- Add stripe_price_id to courses table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN stripe_price_id TEXT;
    RAISE NOTICE 'Added stripe_price_id column to courses table';
  ELSE
    RAISE NOTICE 'stripe_price_id column already exists in courses table';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;



