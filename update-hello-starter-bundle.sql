-- Update Hello Starter Bundle Course
-- Run this in your Supabase SQL Editor

-- If the course already exists, update it:
UPDATE courses 
SET 
  description = 'Master the basics with essential greetings, adjectives, and prepositions. Perfect for anyone preparing to travel, move, or work in a Portuguese-speaking country.',
  lesson_count = 8,
  price = 49.00
WHERE bundle_name = 'hello_starter';

-- If the course doesn't exist yet, insert it:
-- (Only run this if the UPDATE above affects 0 rows)
INSERT INTO courses (name, description, bundle_name, lesson_count, price, stripe_price_id)
SELECT 
  'Hello Starter Bundle',
  'Master the basics with essential greetings, adjectives, and prepositions. Perfect for anyone preparing to travel, move, or work in a Portuguese-speaking country.',
  'hello_starter',
  8,
  49.00,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE bundle_name = 'hello_starter'
);



