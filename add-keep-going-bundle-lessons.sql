-- Add BunnyStream Videos to Keep Going Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in Supabase SQL Editor

-- Step 1: Verify the Keep Going Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'keep_going';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL: https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 1: Location and time', 
    'Learn to express location and time in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/126bce9d-2411-41fe-a48f-2f97b0f74eba', 
    'direct', -- BunnyStream videos work with 'direct' provider
    1, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 2: Daily routines, appointments, and travel', 
    'Master vocabulary for daily routines, appointments, and travel', 
    'https://player.mediadelivery.net/embed/551893/90180ce8-558f-46a3-825e-7d57cf2dee48', 
    'direct',
    2, 
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 3: Talk about plans, intentions, and upcoming events (future tense)', 
    'Learn the future tense to discuss plans and upcoming events', 
    'https://player.mediadelivery.net/embed/551893/e9f6ece3-fcea-4ada-95ec-34e02c69a21c', 
    'direct',
    3, 
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 4: Going to places', 
    'Learn how to talk about going to different places', 
    'https://player.mediadelivery.net/embed/551893/8a7a0b3e-a007-4836-bca0-1a665a733200', 
    'direct',
    4, 
    16
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 5: Express hypothetical situations, wishes, and polite requests', 
    'Master expressing hypothetical situations, wishes, and making polite requests', 
    'https://player.mediadelivery.net/embed/551893/82b42c3e-77ee-485a-8a75-c0713cfbfddd', 
    'direct',
    5, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 6: Vocabulary and phrases for traveling', 
    'Learn essential vocabulary and phrases for traveling', 
    'https://player.mediadelivery.net/embed/551893/4fa727a0-d944-47b3-8cf0-c2039203f295', 
    'direct',
    6, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 7: Communicate effectively in real-life airport scenarios', 
    'Master communication in airport situations', 
    'https://player.mediadelivery.net/embed/551893/8fed1f33-9559-4cbf-b54a-a55002a77f7c', 
    'direct',
    7, 
    10
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'keep_going' LIMIT 1),
    'Lesson 8: Understand and respond to clues in Portuguese', 
    'Learn to understand and respond to clues and hints', 
    'https://player.mediadelivery.net/embed/551893/5084bd7e-cd31-4216-b3b5-5e20869b83dc', 
    'direct',
    8, 
    16
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
WHERE c.bundle_name = 'keep_going'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'keep_going'
GROUP BY c.id, c.name, c.lesson_count;
