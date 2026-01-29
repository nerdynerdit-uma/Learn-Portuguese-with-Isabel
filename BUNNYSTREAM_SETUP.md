# BunnyStream Video Setup Guide

This guide will help you connect your BunnyStream videos to the Hello Starter Bundle course.

## Step 1: Upload Videos to BunnyStream

1. Log in to your BunnyStream account: https://bunny.net/stream/
2. Upload your 8 videos for the Hello Starter Bundle
3. After uploading, you'll get a **Video ID** for each video (e.g., `12345678-1234-1234-1234-123456789abc`)

## Step 2: Get Video URLs

BunnyStream provides different URL formats. For embedding, you'll need the **playback URL**.

### Option A: Direct Playback URL (Recommended)
Format: `https://vz-[library-id].b-cdn.net/[video-id]/play_480p.mp4`

Where:
- `[library-id]` = Your BunnyStream library ID
- `[video-id]` = The video ID from BunnyStream

### Option B: Embed URL
Format: `https://iframe.mediadelivery.net/embed/[library-id]/[video-id]`

### Option C: HLS/DASH Stream
Format: `https://vz-[library-id].b-cdn.net/[video-id]/playlist.m3u8`

**Note:** The course player supports direct video URLs (`.mp4`, `.m3u8`, etc.) and iframe embeds.

## Step 3: Add Videos to Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Open the **SQL Editor**
3. Run the following SQL to add your 8 lessons:

```sql
-- First, get the Hello Starter Bundle course ID
SELECT id, name, bundle_name FROM courses WHERE bundle_name = 'hello_starter';

-- Then insert the 8 lessons (replace [COURSE_ID] with the actual course ID from above)
-- Replace the video_url values with your actual BunnyStream URLs

INSERT INTO lessons (course_id, title, description, video_url, lesson_order, duration_minutes)
VALUES
  ([COURSE_ID], 'Lesson 1: Essential Greetings', 'Learn basic greetings and introductions', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_1/play_480p.mp4', 1, 15),
  ([COURSE_ID], 'Lesson 2: Common Adjectives', 'Master essential adjectives for describing people and things', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_2/play_480p.mp4', 2, 18),
  ([COURSE_ID], 'Lesson 3: Basic Prepositions', 'Understand spatial and temporal prepositions', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_3/play_480p.mp4', 3, 20),
  ([COURSE_ID], 'Lesson 4: Adjectives in Context', 'Practice using adjectives in real conversations', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_4/play_480p.mp4', 4, 17),
  ([COURSE_ID], 'Lesson 5: Prepositions of Place', 'Learn prepositions for describing locations', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_5/play_480p.mp4', 5, 19),
  ([COURSE_ID], 'Lesson 6: Prepositions of Time', 'Master time-related prepositions', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_6/play_480p.mp4', 6, 16),
  ([COURSE_ID], 'Lesson 7: Combining Adjectives and Prepositions', 'Put it all together in practical examples', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_7/play_480p.mp4', 7, 22),
  ([COURSE_ID], 'Lesson 8: Review and Practice', 'Comprehensive review of all concepts learned', 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/YOUR_VIDEO_ID_8/play_480p.mp4', 8, 21);
```

## Step 4: Using BunnyStream Embed (Alternative)

If you prefer to use BunnyStream's embed player instead of direct video URLs, you can use this format:

```sql
INSERT INTO lessons (course_id, title, description, video_url, lesson_order, duration_minutes, video_type)
VALUES
  ([COURSE_ID], 'Lesson 1: Essential Greetings', 'Learn basic greetings and introductions', 'https://iframe.mediadelivery.net/embed/YOUR_LIBRARY_ID/YOUR_VIDEO_ID_1', 1, 15, 'iframe');
```

**Note:** You may need to add a `video_type` column to your `lessons` table if you want to support different video types. The current player supports:
- Direct video URLs (`.mp4`, `.m3u8`, etc.)
- YouTube URLs
- Vimeo URLs
- Iframe embeds

## Step 5: Verify Your Setup

1. Go to: http://localhost:5173/courses.html
2. Purchase the Hello Starter Bundle (or use your test account)
3. Go to: http://localhost:5173/account.html
4. Click "Continue Learning" on the Hello Starter Bundle
5. You should see all 8 lessons with working video players

## Troubleshooting

### Videos Not Playing?
- Check that your BunnyStream URLs are correct
- Verify the video is published/public in BunnyStream
- Check browser console for CORS errors (BunnyStream should handle this automatically)
- Make sure your BunnyStream library allows public playback

### Need to Update a Video URL?
```sql
UPDATE lessons 
SET video_url = 'https://vz-YOUR_LIBRARY_ID.b-cdn.net/NEW_VIDEO_ID/play_480p.mp4'
WHERE course_id = [COURSE_ID] AND lesson_order = [LESSON_NUMBER];
```

### Need to Delete a Lesson?
```sql
DELETE FROM lessons 
WHERE course_id = [COURSE_ID] AND lesson_order = [LESSON_NUMBER];
```

## BunnyStream Security (Optional)

If you want to add security to your videos:
1. Enable token authentication in BunnyStream
2. Generate signed URLs for each video
3. Update the `video_url` in your database with the signed URLs

For more information, see: https://docs.bunny.net/docs/stream-security



