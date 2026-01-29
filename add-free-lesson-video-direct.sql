-- Add video lesson to Free Lesson course
-- Run this in Supabase SQL Editor
-- This version uses the specific course ID from your database

-- Insert lesson for Free Lesson course (using the specific course ID)
INSERT INTO lessons (course_id, title, description, video_url, video_provider, duration, lesson_order)
VALUES (
  '23768183-30df-4fac-91fe-9cf10a0b6cb3', -- Your Free Lesson course ID
  'Free Introduction Lesson',
  'Get started with Portuguese! This free lesson introduces you to the basics of the language.',
  'https://player.mediadelivery.net/embed/551893/2c3ecfb0-5154-4b19-ba83-9cc26530fa75',
  'direct', -- BunnyStream videos work with 'direct' provider
  15, -- Estimated duration in minutes
  1 -- First lesson
)
ON CONFLICT DO NOTHING; -- Prevents duplicate if run multiple times

-- Verify the lesson was added
SELECT 
  c.name as course_name,
  l.title as lesson_title,
  l.video_url,
  l.lesson_order,
  l.created_at
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.id = '23768183-30df-4fac-91fe-9cf10a0b6cb3'
ORDER BY l.lesson_order;
