// Supabase Configuration
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const supabaseUrl = 'https://camcrjlktwltidxggbdq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhbWNyamxrdHdsdGlkeGdnYmRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTYxODQsImV4cCI6MjA3OTc3MjE4NH0.lVI8tAXByJEDElnk9QyFwCqzq1wz4VUA-vLLjVoCIvM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-camcrjlktwltidxggbdq-auth-token'
  }
})

// Database Schema (run these SQL commands in Supabase SQL Editor):

/*
-- Create courses table
CREATE TABLE courses (
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

-- Create lessons table
CREATE TABLE lessons (
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
CREATE TABLE purchases (
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
CREATE TABLE lesson_progress (
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

-- Enable Row Level Security (RLS)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

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

-- Insert course data
INSERT INTO courses (name, description, bundle_name, lesson_count, price, stripe_price_id) VALUES
('Free Lesson', 'Try Out Course', 'free', 1, 0.00, NULL),
('Hello Starter Bundle', 'Master the basics with essential greetings, adjectives, and prepositions.', 'hello_starter', 8, 49.00, NULL),
('Jumpstart Bundle', 'Accelerate your learning', 'jumpstart', 8, 49.00, NULL),
('Grow & Go Bundle', 'Continue your progress', 'grow_go', 8, 49.00, NULL),
('Climb Kit', 'Take it to the next level', 'climb_kit', 8, 49.00, NULL),
('Keep Going Bundle', 'Maintain your momentum', 'keep_going', 8, 49.00, NULL),
('Elevate Essentials', 'Advanced essentials', 'elevate_essentials', 8, 49.00, NULL),
('World Bundle', 'Complete curriculum - all 48 lessons', 'world', 48, 285.00, NULL);
*/


