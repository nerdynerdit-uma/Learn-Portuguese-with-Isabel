-- Add BunnyStream Videos to Jumpstart Bundle
-- This script adds all 8 lessons with BunnyStream video URLs
-- 
-- INSTRUCTIONS:
-- 1. Replace the video_url values below with your actual BunnyStream video URLs
-- 2. Update lesson titles and descriptions as needed
-- 3. Adjust duration (in minutes) to match your actual video lengths
-- 4. Run this script in Supabase SQL Editor

-- Step 1: Verify the Jumpstart Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'jumpstart';

-- Step 2: Insert the 8 lessons
-- Replace the video_url values with your actual BunnyStream URLs
-- Format options:
--   - Embed URL: https://player.mediadelivery.net/embed/[library-id]/[video-id]
--   - Direct URL: https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
VALUES
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 1: Gender and Persons', 
    'Learn about gender and personal forms in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/02e42e37-884e-4c68-9d43-463f2875217c', 
    'direct', -- BunnyStream videos work with 'direct' provider
    1, 
    15
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 2: The Verb "To Be" (Ser and Estar)', 
    'Master the two forms of "to be" in Portuguese', 
    'https://player.mediadelivery.net/embed/551893/2dc9f934-b88f-4acd-a185-c5c28869b401', 
    'direct',
    2, 
    18
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 3: Short Sentences and Opposite Words', 
    'Build short sentences and learn opposite words', 
    'https://player.mediadelivery.net/embed/551893/c99b9255-0245-4af8-ada1-3d627e384263', 
    'direct',
    3, 
    20
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 4: Food and drinks', 
    'Learn vocabulary for food and beverages', 
    'https://player.mediadelivery.net/embed/551893/f26a680c-ea72-48ba-8f48-435ec28a014e', 
    'direct',
    4, 
    17
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 5: Articles and contractions', 
    'Understand articles and how they contract with prepositions', 
    'https://player.mediadelivery.net/embed/551893/bb792fdd-ef26-429a-8ea5-85f3a83a14b7', 
    'direct',
    5, 
    19
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 6: Polite requests and desires', 
    'Learn how to make polite requests and express desires', 
    'https://player.mediadelivery.net/embed/551893/69e49943-1931-41ed-8ab5-4333f430322c', 
    'direct',
    6, 
    16
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 7: Order, explore, and talk about food', 
    'Practice ordering food and discussing meals', 
    'https://player.mediadelivery.net/embed/551893/01cc99a6-e012-427d-b5fe-58aef668e3c4', 
    'direct',
    7, 
    22
  ),
  (
    (SELECT id FROM courses WHERE bundle_name = 'jumpstart' LIMIT 1),
    'Lesson 8: Ask questions and talk about possibilities', 
    'Learn to ask questions and discuss possibilities', 
    'https://player.mediadelivery.net/embed/551893/cb20fecd-d4f1-462f-a040-b87282a9eb14', 
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
WHERE c.bundle_name = 'jumpstart'
ORDER BY l.lesson_order;

-- Step 4: Check lesson count matches
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'jumpstart'
GROUP BY c.id, c.name, c.lesson_count;
