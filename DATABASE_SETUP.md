# Database Setup Guide - Fix "Failed to fetch" Error

This guide will help you set up your Supabase database to fix the authentication error.

## Quick Fix Steps

### Step 1: Verify Supabase Project is Active

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Make sure your project `camcrjlktwltidxggbdq` is active
3. If the project is paused, click "Restore" to reactivate it

### Step 2: Set Up Database Schema

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `setup-database-complete.sql` file
4. Paste it into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
6. Wait for all queries to execute successfully

**Important:** Make sure you see "Success. No rows returned" or similar success messages for all commands.

### Step 3: Enable Authentication in Supabase

1. Go to **Authentication** → **Providers** in Supabase Dashboard
2. Make sure **Email** provider is enabled
3. Under **Email Auth**, ensure:
   - "Enable Email Signup" is ON
   - "Confirm email" can be OFF for testing (you can enable it later)
   - Save the settings

### Step 4: Verify API Settings

1. Go to **Settings** → **API** in Supabase Dashboard
2. Verify that:
   - Project URL matches: `https://camcrjlktwltidxggbdq.supabase.co`
   - Anon public key matches the one in `supabase-config.js`
3. If keys don't match, update `supabase-config.js` with the correct values

### Step 5: Test the Connection

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try to sign up again
4. Check for specific error messages in the console

## Common Issues and Solutions

### Issue 1: "Failed to fetch"
- **Cause:** Database tables not created
- **Solution:** Run the SQL setup script (Step 2 above)

### Issue 2: "Invalid API key"
- **Cause:** Wrong Supabase credentials
- **Solution:** Update `supabase-config.js` with correct URL and key from Supabase Dashboard → Settings → API

### Issue 3: "Network error"
- **Cause:** Project might be paused or inactive
- **Solution:** Go to Supabase Dashboard and restore/reactivate the project

### Issue 4: "Email confirmation required"
- **Cause:** Email confirmation is enabled
- **Solution:** 
  - Check your email for a confirmation link, OR
  - Go to Authentication → Providers → Email and disable "Confirm email" for testing

### Issue 5: CORS errors
- **Cause:** Browser blocking requests
- **Solution:** This should work automatically with Supabase. If you see CORS errors, make sure you're accessing the site via `http://localhost:5173` not `file://`

## Verify Database Setup

After running the SQL script, verify everything is set up:

1. Go to **Table Editor** in Supabase Dashboard
2. You should see these tables:
   - ✅ `courses` (should have 8 courses)
   - ✅ `lessons` (should have lessons for Hello Starter Bundle)
   - ✅ `purchases` (empty initially)
   - ✅ `lesson_progress` (empty initially)
   - ✅ `auth.users` (Supabase built-in table)

3. Go to **Authentication** → **Users**
   - You should be able to see users here after signing up

## Testing Authentication

1. **Test Sign Up:**
   - Go to `http://localhost:5173/signup.html`
   - Fill in the form
   - Click "Create Account"
   - Check the browser console for any errors

2. **Test Sign In:**
   - After signing up, go to `http://localhost:5173/signin.html`
   - Use the same credentials
   - Check if you can log in successfully

3. **Check Account Page:**
   - After signing in, go to `http://localhost:5173/account.html`
   - You should see "Welcome, [Your Name]!" if authentication is working

## Need Help?

If you're still seeing errors:

1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Try to sign up/sign in
4. Copy the exact error message
5. Check the **Network** tab to see which request is failing
6. The error message will tell you exactly what's wrong

## Quick SQL Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('courses', 'lessons', 'purchases', 'lesson_progress');

-- Check courses count
SELECT COUNT(*) as course_count FROM courses;

-- Check lessons count
SELECT COUNT(*) as lesson_count FROM lessons;

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

All queries should return results if setup is correct.
