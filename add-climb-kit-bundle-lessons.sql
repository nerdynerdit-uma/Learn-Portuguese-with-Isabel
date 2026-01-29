-- Add BunnyStream Videos to Climb Kit Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in Supabase SQL Editor

-- Step 1: Verify the Climb Kit Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'climb_kit';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL: https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 1: Possessive adjectives', 
    'Learn possessive adjectives and how to use them correctly', 
    'https://player.mediadelivery.net/embed/551893/362700ae-8ed6-4f6f-b13d-8cadefd7e92d', 
    'direct', -- BunnyStream videos work with 'direct' provider
    1, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 2: Commands, instructions, and suggestions', 
    'Master giving commands, instructions, and making suggestions', 
    'https://player.mediadelivery.net/embed/551893/0627cc65-2caa-4608-87e3-84f2db63aabf', 
    'direct',
    2, 
    19
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 3: Clothes and laundry', 
    'Learn vocabulary for clothing and laundry-related activities', 
    'https://player.mediadelivery.net/embed/551893/5fc8a2c9-ee47-49c5-b8d1-a93d413657e2', 
    'direct',
    3, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 4: Travel, commute, and explore with confidence', 
    'Master vocabulary and phrases for travel and commuting', 
    'https://player.mediadelivery.net/embed/551893/40bde763-4bb1-4e6e-970b-a89180c38ab6', 
    'direct',
    4, 
    18
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 5: Regular and common irregular verbs', 
    'Learn regular verb patterns and common irregular verbs', 
    'https://player.mediadelivery.net/embed/551893/38a2a549-3309-4bd2-b27c-b877a8b322fe', 
    'direct',
    5, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 6: Common idiomatic expressions', 
    'Master common Portuguese idiomatic expressions', 
    'https://player.mediadelivery.net/embed/551893/70f45317-2b07-4c78-b888-e03e67234171', 
    'direct',
    6, 
    18
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 7: Animals and quantities', 
    'Learn vocabulary for animals and expressing quantities', 
    'https://player.mediadelivery.net/embed/551893/a799ff84-3163-4ee2-9d13-c1605d3f4051', 
    'direct',
    7, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'climb_kit' LIMIT 1),
    'Lesson 8: Weather and time', 
    'Master talking about weather and time expressions', 
    'https://player.mediadelivery.net/embed/551893/8168ab87-fac1-4cb0-af07-5ca797070bc2', 
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
WHERE c.bundle_name = 'climb_kit'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'climb_kit'
GROUP BY c.id, c.name, c.lesson_count;
