-- Update Hello Starter Bundle price to €1.00
-- Run this in your Supabase SQL Editor

UPDATE courses 
SET price = 1.00
WHERE bundle_name = 'hello_starter';

-- Verify the update
SELECT id, name, bundle_name, price 
FROM courses 
WHERE bundle_name = 'hello_starter';

