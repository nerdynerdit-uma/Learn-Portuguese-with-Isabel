# Fix Schema Cache Issue - Quick Solution

## Problem
Your tables exist but Supabase PostgREST can't see them in the schema cache. Error: `PGRST205 - Could not find the table 'public.courses' in the schema cache`

## Quick Fix (Choose One Method)

### Method 1: Refresh Schema Cache (Easiest)
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `camcrjlktwltidxggbdq`
3. Go to **Settings** → **API** (left sidebar)
4. Scroll down to find **"Reload schema cache"** or similar button
5. Click it and wait 10-30 seconds
6. Try signing up again

### Method 2: Restart PostgREST (If Method 1 doesn't work)
1. Go to Supabase Dashboard → **Settings** → **General**
2. Look for **"Restart services"** or **"Restart PostgREST"**
3. This will refresh all schema caches
4. Wait 1-2 minutes for services to restart

### Method 3: Verify Tables in Public Schema (Most Reliable)
Run this SQL in Supabase SQL Editor to check:

```sql
-- Check if tables are in public schema
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('courses', 'lessons', 'purchases', 'lesson_progress');

-- If tables don't appear, they might be in wrong schema
-- Run this to check all schemas:
SELECT schemaname, tablename 
FROM pg_tables 
WHERE tablename IN ('courses', 'lessons', 'purchases', 'lesson_progress');
```

If tables are missing, run the complete setup script again:

1. Go to **SQL Editor** in Supabase
2. Open `setup-database-complete.sql`
3. Copy and paste the entire file
4. Run it

### Method 4: Grant Public Access (If RLS is the issue)
Run this SQL to ensure public schema is accessible:

```sql
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant select on all tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant select on future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon, authenticated;
```

## Verify After Fix

1. Go back to: `http://localhost:5173/test-supabase-connection.html`
2. Click **"Test Connection"** again
3. It should now show ✅ Connection Successful
4. Try signing up at `http://localhost:5173/signup.html`

## Most Common Solution

**99% of the time, Method 1 (Refresh Schema Cache) fixes it immediately.**

Just go to Settings → API → Reload schema cache, wait 30 seconds, and try again!
