-- Add BunnyStream Videos to Hello Starter Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
--    (just swap YOUR_VIDEO_ID_X with the real Bunny video IDs)
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in the Supabase SQL Editor

-- Step 1: Verify the Hello Starter Bundle course exists
SELECT id, name, bundle_name, lesson_count
FROM courses
WHERE bundle_name = 'hello_starter';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL:  https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 1: Personal Names, Countries & Adjectives',
    'Introduces personal names, countries, and core adjectives to describe people and places.',
    'https://player.mediadelivery.net/embed/551893/9a47fc67-3409-4014-9bab-3ca57821ecc9',
    'direct', -- BunnyStream videos work with ''direct'' provider
    1,
    21  -- duration in minutes (adjust)
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 2: Adjectives & Everyday Vocabulary – Building Short Sentences',
    'Practice adjectives and everyday vocabulary while building short, clear sentences.',
    'https://player.mediadelivery.net/embed/551893/06a52605-4538-4fdc-b976-83711be41fe6 ',
    'direct',
    2,
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 3: Greetings & First Conversations',
    'Learn greetings, first questions, and key expressions like \"Tudo bem?\" and \"Como está?\".',
    'https://player.mediadelivery.net/embed/551893/96c005d7-9200-4807-a168-8bac0ce1fb88 ',
    'direct',
    3,
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 4: Talking About Time & Daily Context',
    'Covers hoje, amanhã, counting to 12, and structures like temos / tenho for real-life context.',
    'https://player.mediadelivery.net/embed/551893/d775cd75-ced3-490c-b1e6-2f0790331b3e ',
    'direct',
    4,
    19
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 5: Places & Drinks Vocabulary',
    'Vocabulary for cafés, drinks (bica, caneca, fino, cerveja) and using in / on / at in context.',
    'https://player.mediadelivery.net/embed/551893/75d2051c-6bf1-4571-89c9-d720c520cd02 ',
    'direct',
    5,
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 6: Days of the Week & Expressing Existence',
    'Learn days of the week and how to use \"há\" (there is/are) in everyday sentences.',
    'https://player.mediadelivery.net/embed/551893/51b56461-0400-4402-8a8f-dd2499d3df2a',
    'direct',
    6,
    23
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 7: Months & Seasons of the Year',
    'Covers months, seasons, and how to talk about time periods and plans.',
    'https://player.mediadelivery.net/embed/551893/fdb13dd5-1614-4c07-8032-12cb1134e073',
    'direct',
    7,
    24
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 8: Demonstratives & Everyday Expressions',
    'Introduces este, esta, isto and expressions like chega, não chega, quero mais in context.',
    'https://player.mediadelivery.net/embed/551893/c64f3ab6-613d-477e-9cb6-4dd037c9b4b8 ',
    'direct',
    8,
    18
  )
ON CONFLICT DO NOTHING;

-- Step 3: Verify the lessons were added successfully
SELECT 
  l.id,
  l.lesson_order,
  l.title,
  l.duration,
  LEFT(l.video_url, 80) || '...' AS video_url_preview,
  c.name AS course_name
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'hello_starter'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count AS expected_lessons,
  COUNT(l.id)     AS actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'hello_starter'
GROUP BY c.id, c.name, c.lesson_count;

