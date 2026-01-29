-- Add BunnyStream Videos to Grow & Go Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in Supabase SQL Editor

-- Step 1: Verify the Grow & Go Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'grow_go';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL: https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 1: Food and preferences', 
    'Learn vocabulary for food and how to express preferences', 
    'https://player.mediadelivery.net/embed/551893/d01973ae-b40e-4440-a4cd-6fcd13363faf', 
    'direct', -- BunnyStream videos work with 'direct' provider
    1, 
    27
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 2: Learn how to talk about likes, preferences, and needs', 
    'Master expressing what you like, prefer, and need in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/84547573-4a9b-4404-8976-3e9f685d69e2', 
    'direct',
    2, 
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 3: Understand the three main verb endings: -ar, -er, -ir', 
    'Learn the three main verb conjugation patterns in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/d3909bec-254e-4aff-bd31-491bb4399975', 
    'direct',
    3, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 4: Body parts', 
    'Learn vocabulary for parts of the body', 
    'https://player.mediadelivery.net/embed/551893/d8e94e8a-818b-4116-8093-a42318a819bf', 
    'direct',
    4, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 5: Build simple comparisons and contrasts in Portuguese', 
    'Learn how to make comparisons and express contrasts', 
    'https://player.mediadelivery.net/embed/551893/edb661cf-da3b-4312-8285-e3f1a36c8a0b', 
    'direct',
    5, 
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 6: Use colors with nouns, applying gender and number agreement', 
    'Master using colors correctly with proper gender and number agreement', 
    'https://player.mediadelivery.net/embed/551893/f32f5733-7c5c-44b6-9d3e-4b7e33cc0609', 
    'direct',
    6, 
    16
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 7: Irregular verbs', 
    'Learn common irregular verbs and their conjugations', 
    'https://player.mediadelivery.net/embed/551893/044fc3fd-e026-4908-8488-0c1fb3429925', 
    'direct',
    7, 
    28
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'grow_go' LIMIT 1),
    'Lesson 8: Verb ter (to have)', 
    'Master the verb "ter" (to have) and its uses', 
    'https://player.mediadelivery.net/embed/551893/19f87251-d08d-4312-a1f1-05935434163e', 
    'direct',
    8, 
    19
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
WHERE c.bundle_name = 'grow_go'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'grow_go'
GROUP BY c.id, c.name, c.lesson_count;
