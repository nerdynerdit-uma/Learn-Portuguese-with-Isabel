-- Complete Database Setup for Learn Portuguese with Isabel LMS
-- Run this entire script in your Supabase SQL Editor

-- ============================================
-- STEP 1: Create Tables
-- ============================================

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  bundle_name TEXT NOT NULL,
  lesson_count INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists (for existing databases)
DO $$ 
BEGIN
  -- Add stripe_price_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN stripe_price_id TEXT;
  END IF;
  
  -- Add created_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE courses ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE courses ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_provider TEXT DEFAULT 'vimeo', -- 'vimeo', 'youtube', or 'direct'
  duration INTEGER, -- in minutes
  lesson_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress_percentage INTEGER DEFAULT 0, -- 0-100
  last_watched_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- ============================================
-- STEP 2: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create RLS Policies
-- ============================================

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Lessons are viewable by everyone" ON lessons;
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON lesson_progress;

-- Policies for courses (public read)
CREATE POLICY "Courses are viewable by everyone" ON courses
  FOR SELECT USING (true);

-- Policies for lessons (public read)
CREATE POLICY "Lessons are viewable by everyone" ON lessons
  FOR SELECT USING (true);

-- Policies for purchases (users can only see their own purchases)
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Policies for lesson_progress (users can only see their own progress)
CREATE POLICY "Users can view own progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STEP 4: Insert Course Data
-- ============================================

-- Insert courses (only if they don't exist)
-- First, ensure stripe_price_id column exists (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN stripe_price_id TEXT;
  END IF;
END $$;

-- Now insert courses
INSERT INTO courses (name, description, bundle_name, lesson_count, price, stripe_price_id) 
SELECT * FROM (VALUES
  ('Free Lesson', 'Try Out Course', 'free', 1, 0.00, NULL),
  ('Hello Starter Bundle', 'Master the basics with essential greetings, adjectives, and prepositions.', 'hello_starter', 8, 1.00, NULL),
  ('Jumpstart Bundle', 'Accelerate your learning', 'jumpstart', 8, 49.99, NULL),
  ('Grow & Go Bundle', 'Continue your progress', 'grow_go', 8, 49.99, NULL),
  ('Climb Kit', 'Take it to the next level', 'climb_kit', 8, 49.99, NULL),
  ('Keep Going Bundle', 'Maintain your momentum', 'keep_going', 8, 49.99, NULL),
  ('Elevate Essentials', 'Advanced essentials', 'elevate_essentials', 8, 49.99, NULL),
  ('World Bundle', 'Complete curriculum - all 48 lessons', 'world', 48, 249.99, NULL)
) AS v(name, description, bundle_name, lesson_count, price, stripe_price_id)
WHERE NOT EXISTS (
  SELECT 1 FROM courses WHERE courses.bundle_name = v.bundle_name
);

-- ============================================
-- STEP 5: Add Hello Starter Bundle Videos
-- ============================================

-- Insert the 8 BunnyStream lessons for Hello Starter Bundle
INSERT INTO lessons (course_id, title, description, video_url, lesson_order, duration)
SELECT 
  c.id,
  lesson_data.title,
  lesson_data.description,
  lesson_data.video_url,
  lesson_data.lesson_order,
  lesson_data.duration
FROM courses c
CROSS JOIN (VALUES
  ('Lesson 1: Essential Greetings', 'Learn basic greetings and introductions in Portuguese', 'https://player.mediadelivery.net/embed/551893/9a47fc67-3409-4014-9bab-3ca57821ecc9', 1, 15),
  ('Lesson 2: Common Adjectives', 'Master essential adjectives for describing people and things', 'https://player.mediadelivery.net/embed/551893/06a52605-4538-4fdc-b976-83711be41fe6', 2, 18),
  ('Lesson 3: Basic Prepositions', 'Understand spatial and temporal prepositions', 'https://player.mediadelivery.net/embed/551893/96c005d7-9200-4807-a168-8bac0ce1fb88', 3, 20),
  ('Lesson 4: Adjectives in Context', 'Practice using adjectives in real conversations', 'https://player.mediadelivery.net/embed/551893/d775cd75-ced3-490c-b1e6-2f0790331b3e', 4, 17),
  ('Lesson 5: Prepositions of Place', 'Learn prepositions for describing locations', 'https://player.mediadelivery.net/embed/551893/75d2051c-6bf1-4571-89c9-d720c520cd02', 5, 19),
  ('Lesson 6: Prepositions of Time', 'Master time-related prepositions', 'https://player.mediadelivery.net/embed/551893/51b56461-0400-4402-8a8f-dd2499d3df2a', 6, 16),
  ('Lesson 7: Combining Adjectives and Prepositions', 'Put it all together in practical examples', 'https://player.mediadelivery.net/embed/551893/fdb13dd5-1614-4c07-8032-12cb1134e073', 7, 22),
  ('Lesson 8: Review and Practice', 'Comprehensive review of all concepts learned', 'https://player.mediadelivery.net/embed/551893/c64f3ab6-613d-477e-9cb6-4dd037c9b4b8', 8, 21)
) AS lesson_data(title, description, video_url, lesson_order, duration)
WHERE c.bundle_name = 'hello_starter'
  AND NOT EXISTS (
    SELECT 1 FROM lessons l 
    WHERE l.course_id = c.id 
    AND l.lesson_order = lesson_data.lesson_order
  );

-- ============================================
-- STEP 6: Verify Setup
-- ============================================

-- Check courses
SELECT 'Courses' as table_name, COUNT(*) as count FROM courses;

-- Check lessons for Hello Starter Bundle
SELECT 
  'Hello Starter Lessons' as info,
  l.lesson_order,
  l.title,
  l.duration,
  LEFT(l.video_url, 50) || '...' as video_url_preview
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.bundle_name = 'hello_starter'
ORDER BY l.lesson_order;

