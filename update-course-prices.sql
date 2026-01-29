-- Update course prices (run in Supabase SQL Editor)
-- Hello Starter, Jumpstart, Grow & Go, Climb Kit, Keep Going, Elevate Essentials: €49.00
-- World Bundle: €285.00

UPDATE courses SET price = 49.00 WHERE bundle_name = 'hello_starter';
UPDATE courses SET price = 49.00 WHERE bundle_name = 'jumpstart';
UPDATE courses SET price = 49.00 WHERE bundle_name = 'grow_go';
UPDATE courses SET price = 49.00 WHERE bundle_name = 'climb_kit';
UPDATE courses SET price = 49.00 WHERE bundle_name = 'keep_going';
UPDATE courses SET price = 49.00 WHERE bundle_name = 'elevate_essentials';
UPDATE courses SET price = 285.00 WHERE bundle_name = 'world';

-- Verify (run in Supabase SQL Editor to check prices):
-- SELECT name, bundle_name, price FROM courses ORDER BY bundle_name;
