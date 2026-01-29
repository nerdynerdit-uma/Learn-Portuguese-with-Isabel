-- Add BunnyStream Videos to Hello Starter Bundle
-- This script adds all 8 lessons with the provided BunnyStream embed URLs

-- Step 1: Get the Hello Starter Bundle course ID
-- Run this first to get the course ID, then replace [COURSE_ID] below
SELECT id, name, bundle_name FROM courses WHERE bundle_name = 'hello_starter';

-- Step 2: Insert the 8 lessons
-- Replace [COURSE_ID] with the actual course ID from Step 1

INSERT INTO lessons (course_id, title, description, video_url, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 1: Essential Greetings', 
    'Learn basic greetings and introductions in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/9a47fc67-3409-4014-9bab-3ca57821ecc9', 
    1, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 2: Common Adjectives', 
    'Master essential adjectives for describing people and things', 
    'https://player.mediadelivery.net/embed/551893/06a52605-4538-4fdc-b976-83711be41fe6', 
    2, 
    18
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 3: Basic Prepositions', 
    'Understand spatial and temporal prepositions', 
    'https://player.mediadelivery.net/embed/551893/96c005d7-9200-4807-a168-8bac0ce1fb88', 
    3, 
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 4: Adjectives in Context', 
    'Practice using adjectives in real conversations', 
    'https://player.mediadelivery.net/embed/551893/d775cd75-ced3-490c-b1e6-2f0790331b3e', 
    4, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 5: Prepositions of Place', 
    'Learn prepositions for describing locations', 
    'https://player.mediadelivery.net/embed/551893/75d2051c-6bf1-4571-89c9-d720c520cd02', 
    5, 
    19
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 6: Prepositions of Time', 
    'Master time-related prepositions', 
    'https://player.mediadelivery.net/embed/551893/51b56461-0400-4402-8a8f-dd2499d3df2a', 
    6, 
    16
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 7: Combining Adjectives and Prepositions', 
    'Put it all together in practical examples', 
    'https://player.mediadelivery.net/embed/551893/fdb13dd5-1614-4c07-8032-12cb1134e073', 
    7, 
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'hello_starter' LIMIT 1),
    'Lesson 8: Review and Practice', 
    'Comprehensive review of all concepts learned', 
    'https://player.mediadelivery.net/embed/551893/c64f3ab6-613d-477e-9cb6-4dd037c9b4b8', 
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
  l.video_url,
  c.name as course_name
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'hello_starter'
ORDER BY l.lesson_order;

