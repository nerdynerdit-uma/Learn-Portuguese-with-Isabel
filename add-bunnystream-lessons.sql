-- Add BunnyStream Videos to Hello Starter Bundle
-- 
-- INSTRUCTIONS:
-- 1. Replace [COURSE_ID] with your Hello Starter Bundle course ID (run the SELECT query below first)
-- 2. Replace YOUR_LIBRARY_ID with your BunnyStream library ID
-- 3. Replace YOUR_VIDEO_ID_1 through YOUR_VIDEO_ID_8 with your actual BunnyStream video IDs
-- 4. Adjust lesson titles and descriptions as needed
-- 5. Update duration_minutes to match your actual video lengths

-- Step 1: Get the Hello Starter Bundle course ID
SELECT id, name, bundle_name FROM courses WHERE bundle_name = 'hello_starter';

-- Step 2: Insert the 8 lessons (replace [COURSE_ID] with the ID from Step 1)
-- Replace the video URLs with your actual BunnyStream URLs

INSERT INTO lessons (course_id, title, description, video_url, lesson_order, duration_minutes)
VALUES
  (
    '[COURSE_ID]', -- Replace with actual course ID
    'Lesson 1: Essential Greetings', 
    'Learn basic greetings and introductions in Portuguese', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_1/play_480p.mp4', 
    1, 
    15
  ),
  (
    '[COURSE_ID]',
    'Lesson 2: Common Adjectives', 
    'Master essential adjectives for describing people and things', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_2/play_480p.mp4', 
    2, 
    18
  ),
  (
    '[COURSE_ID]',
    'Lesson 3: Basic Prepositions', 
    'Understand spatial and temporal prepositions', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_3/play_480p.mp4', 
    3, 
    20
  ),
  (
    '[COURSE_ID]',
    'Lesson 4: Adjectives in Context', 
    'Practice using adjectives in real conversations', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_4/play_480p.mp4', 
    4, 
    17
  ),
  (
    '[COURSE_ID]',
    'Lesson 5: Prepositions of Place', 
    'Learn prepositions for describing locations', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_5/play_480p.mp4', 
    5, 
    19
  ),
  (
    '[COURSE_ID]',
    'Lesson 6: Prepositions of Time', 
    'Master time-related prepositions', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_6/play_480p.mp4', 
    6, 
    16
  ),
  (
    '[COURSE_ID]',
    'Lesson 7: Combining Adjectives and Prepositions', 
    'Put it all together in practical examples', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_7/play_480p.mp4', 
    7, 
    22
  ),
  (
    '[COURSE_ID]',
    'Lesson 8: Review and Practice', 
    'Comprehensive review of all concepts learned', 
    'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_8/play_480p.mp4', 
    8, 
    21
  );

-- Step 3: Verify the lessons were added
SELECT 
  l.id,
  l.lesson_order,
  l.title,
  l.duration_minutes,
  c.name as course_name
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'hello_starter'
ORDER BY l.lesson_order;



