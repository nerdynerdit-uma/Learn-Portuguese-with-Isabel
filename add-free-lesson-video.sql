-- Add video lesson to Free Lesson course
-- Run this in Supabase SQL Editor

-- Insert lesson for Free Lesson course
-- This will find the course with bundle_name = 'free' and add the lesson
INSERT INTO lessons (course_id, title, description, video_url, video_provider, duration, lesson_order)
SELECT 
  c.id,
  'Free Introduction Lesson',
  'Get started with Portuguese! This free lesson introduces you to the basics of the language.',
  'https://player.mediadelivery.net/embed/551893/2c3ecfb0-5154-4b19-ba83-9cc26530fa75',
  'direct', -- BunnyStream videos work with 'direct' provider
  15, -- Estimated duration in minutes (adjust as needed)
  1 -- First lesson
FROM courses c
WHERE c.bundle_name = 'free'
  AND NOT EXISTS (
    -- Only insert if lesson doesn't already exist
    SELECT 1 FROM lessons l 
    WHERE l.course_id = c.id 
    AND l.lesson_order = 1
  );

-- Verify the lesson was added
SELECT 
  c.name as course_name,
  l.title as lesson_title,
  l.video_url,
  l.lesson_order,
  l.created_at
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'free'
ORDER BY l.lesson_order;
