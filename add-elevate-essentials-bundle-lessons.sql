-- Add BunnyStream Videos to Elevate Essentials Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in Supabase SQL Editor

-- Step 1: Verify the Elevate Essentials Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'elevate_essentials';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL: https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 1: Tourism and holidays in Portugal', 
    'Learn vocabulary and phrases for tourism and holidays', 
    'https://player.mediadelivery.net/embed/551893/c6939467-350a-478e-ac92-b096751c77ed', 
    'direct', -- BunnyStream videos work with 'direct' provider
    1, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 2: Ask and discuss prices in Portuguese', 
    'Master how to ask about prices and discuss costs', 
    'https://player.mediadelivery.net/embed/551893/9a814296-40d2-444c-9bbb-1f4d9713948e', 
    'direct',
    2, 
    18
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 3: Properties, homes, and objects in Portuguese', 
    'Learn vocabulary for properties, homes, and everyday objects', 
    'https://player.mediadelivery.net/embed/551893/06c9fc94-c500-4029-b94d-86bc0f8e4013', 
    'direct',
    3, 
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 4: Recent events and experiences', 
    'Learn to talk about recent events and personal experiences', 
    'https://player.mediadelivery.net/embed/551893/705fd930-c7da-4608-9f65-6e7b097d113a', 
    'direct',
    4, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 5: Past habits, routines, and events', 
    'Master talking about past habits and routines', 
    'https://player.mediadelivery.net/embed/551893/8668b6e6-4f17-46a6-9a76-8cefb3025701', 
    'direct',
    5, 
    19
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 6: The versatile Portuguese verb "poder"', 
    'Learn all the uses of the verb "poder" (can/may)', 
    'https://player.mediadelivery.net/embed/551893/d5503151-a7aa-4ff0-b0c7-3d5229db3170', 
    'direct',
    6, 
    16
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 7: Jobs, professions, and making appointments in Portuguese', 
    'Learn vocabulary for jobs and how to make appointments', 
    'https://player.mediadelivery.net/embed/551893/3fcf1988-db06-4fef-9f55-8b7f1a3049d0', 
    'direct',
    7, 
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'elevate_essentials' LIMIT 1),
    'Lesson 8: Shopping at a supermarket', 
    'Master vocabulary and phrases for shopping at supermarkets', 
    'https://player.mediadelivery.net/embed/551893/dc449209-2bec-4b02-9973-69c0fb927ebd', 
    'direct',
    8, 
    21
  )
ON CONFLICT DO NOTHING;

-- Step 3: Verify the lessons were added successfully
SELECT 
  l.id,
  l.lesson_order,
  l.title,
  l.duration,
  LEFT(l.video_url, 80) || '...' as video_url_preview,
  c.name as course_name
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'elevate_essentials'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'elevate_essentials'
GROUP BY c.id, c.name, c.lesson_count;
