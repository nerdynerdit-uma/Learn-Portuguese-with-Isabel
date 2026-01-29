-- Add All Lessons to World Bundle
-- This script copies all lessons from the 6 bundles to the World Bundle
-- The World Bundle includes:
--   - Hello Starter Bundle (8 lessons)
--   - Jumpstart Bundle (8 lessons)
--   - Grow & Go Bundle (8 lessons)
--   - Climb Kit Bundle (8 lessons)
--   - Keep Going Bundle (8 lessons)
--   - Elevate Essentials Bundle (8 lessons)
-- Total: 48 lessons
--
-- INSTRUCTIONS:
-- 1. Make sure all other bundles have their lessons added first
-- 2. Run this script in Supabase SQL Editor
-- 3. The script will automatically copy all lessons with proper naming

-- Step 1: Verify the World Bundle course exists
SELECT id, name, bundle_name, lesson_count FROM courses WHERE bundle_name = 'world';

-- Step 2: Verify all source bundles have lessons
SELECT 
  c.bundle_name,
  c.name,
  COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name IN ('hello_starter', 'jumpstart', 'grow_go', 'climb_kit', 'keep_going', 'elevate_essentials')
GROUP BY c.id, c.bundle_name, c.name
ORDER BY 
  CASE c.bundle_name
    WHEN 'hello_starter' THEN 1
    WHEN 'jumpstart' THEN 2
    WHEN 'grow_go' THEN 3
    WHEN 'climb_kit' THEN 4
    WHEN 'keep_going' THEN 5
    WHEN 'elevate_essentials' THEN 6
  END;

-- Step 3: Insert all lessons into World Bundle with bundle name prefix
-- This copies all lessons from the 6 bundles and adds them to the World Bundle
-- with titles formatted as: "[Bundle Name] - [Lesson Title]"

INSERT INTO lessons (course_id, title, description, video_url, video_provider, lesson_order, duration)
SELECT 
  (SELECT id FROM courses WHERE bundle_name = 'world' LIMIT 1) as course_id,
  CASE 
    WHEN c.bundle_name = 'hello_starter' THEN 'Hello Starter Bundle - ' || l.title
    WHEN c.bundle_name = 'jumpstart' THEN 'Jumpstart Bundle - ' || l.title
    WHEN c.bundle_name = 'grow_go' THEN 'Grow & Go Bundle - ' || l.title
    WHEN c.bundle_name = 'climb_kit' THEN 'Climb Kit Bundle - ' || l.title
    WHEN c.bundle_name = 'keep_going' THEN 'Keep Going Bundle - ' || l.title
    WHEN c.bundle_name = 'elevate_essentials' THEN 'Elevate Essentials Bundle - ' || l.title
    ELSE l.title
  END as title,
  l.description,
  l.video_url,
  l.video_provider,
  -- Calculate lesson_order: bundle offset + lesson_order within bundle
  (CASE c.bundle_name
    WHEN 'hello_starter' THEN 0
    WHEN 'jumpstart' THEN 8
    WHEN 'grow_go' THEN 16
    WHEN 'climb_kit' THEN 24
    WHEN 'keep_going' THEN 32
    WHEN 'elevate_essentials' THEN 40
    ELSE 0
  END + l.lesson_order) as lesson_order,
  l.duration
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name IN ('hello_starter', 'jumpstart', 'grow_go', 'climb_kit', 'keep_going', 'elevate_essentials')
ORDER BY 
  CASE c.bundle_name
    WHEN 'hello_starter' THEN 1
    WHEN 'jumpstart' THEN 2
    WHEN 'grow_go' THEN 3
    WHEN 'climb_kit' THEN 4
    WHEN 'keep_going' THEN 5
    WHEN 'elevate_essentials' THEN 6
  END,
  l.lesson_order
ON CONFLICT DO NOTHING;

-- Step 4: Verify the lessons were added successfully
SELECT 
  l.lesson_order,
  l.title,
  l.duration,
  LEFT(l.video_url, 80) || '...' as video_url_preview
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'world'
ORDER BY l.lesson_order;

-- Step 5: Check lesson count matches expected (48 lessons)
SELECT 
  c.name,
  c.lesson_count as expected_lessons,
  COUNT(l.id) as actual_lessons,
  CASE 
    WHEN COUNT(l.id) = 48 THEN '✓ Correct'
    ELSE '✗ Missing lessons'
  END as status
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.bundle_name = 'world'
GROUP BY c.id, c.name, c.lesson_count;

-- Step 6: Show breakdown by bundle
SELECT 
  bundle_name,
  COUNT(*) as lesson_count
FROM (
  SELECT 
    CASE 
      WHEN l.title LIKE 'Hello Starter Bundle%' THEN 'Hello Starter Bundle'
      WHEN l.title LIKE 'Jumpstart Bundle%' THEN 'Jumpstart Bundle'
      WHEN l.title LIKE 'Grow & Go Bundle%' THEN 'Grow & Go Bundle'
      WHEN l.title LIKE 'Climb Kit Bundle%' THEN 'Climb Kit Bundle'
      WHEN l.title LIKE 'Keep Going Bundle%' THEN 'Keep Going Bundle'
      WHEN l.title LIKE 'Elevate Essentials Bundle%' THEN 'Elevate Essentials Bundle'
    END as bundle_name
  FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE c.bundle_name = 'world'
) as bundle_lessons
WHERE bundle_name IS NOT NULL
GROUP BY bundle_name
ORDER BY 
  CASE bundle_name
    WHEN 'Hello Starter Bundle' THEN 1
    WHEN 'Jumpstart Bundle' THEN 2
    WHEN 'Grow & Go Bundle' THEN 3
    WHEN 'Climb Kit Bundle' THEN 4
    WHEN 'Keep Going Bundle' THEN 5
    WHEN 'Elevate Essentials Bundle' THEN 6
  END;
