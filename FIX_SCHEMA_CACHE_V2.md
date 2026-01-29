# Fix Schema Cache - Updated Instructions for New Supabase Dashboard

## Method 1: Use SQL Editor to Refresh Cache (RECOMMENDED)

1. In your Supabase Dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button
3. Copy and paste this SQL command:

```sql
-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
```

4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait 10-20 seconds
6. Try signing up again at your website

## Method 2: Check Table Editor to Verify Tables

1. Click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `courses`
   - `lessons`
   - `purchases`
   - `lesson_progress`

If you see them, tables exist. If not, run the setup script.

## Method 3: Grant Permissions (If still having issues)

Run this in SQL Editor:

```sql
-- Grant necessary permissions on schema and tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL ON TABLES TO anon, authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
```

## Method 4: Check Project Settings

1. Click **"Project Settings"** in the left sidebar
2. Look for:
   - **"Database"** section - check connection settings
   - **"API"** section - might be here in newer dashboards
3. Look for any "Refresh" or "Reload" buttons

## Method 5: Verify Tables Have Data

Since your tables show 0 rows, they might be empty. Run this to verify:

```sql
-- Check if courses table exists and has structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND table_schema = 'public';

-- Check all your tables
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'lessons', 'purchases', 'lesson_progress');
```

## If Nothing Works: Re-run Setup Script

1. Go to **SQL Editor**
2. Open `setup-database-complete.sql` file from your project
3. Copy the entire contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Wait for all commands to complete
7. Run the schema refresh: `NOTIFY pgrst, 'reload schema';`

## Test After Fix

1. Go to: `http://localhost:5173/test-supabase-connection.html`
2. Click **"Test Connection"** - should show ✅
3. Try signing up at: `http://localhost:5173/signup.html`

## Most Likely Solution

**Just run this in SQL Editor:**

```sql
NOTIFY pgrst, 'reload schema';
```

Wait 20 seconds, then try again. This refreshes the cache 90% of the time.
