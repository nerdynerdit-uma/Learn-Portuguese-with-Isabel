# LMS Setup Guide

This guide will help you set up the Learning Management System for Learn Portuguese with Isabel.

## Prerequisites

- Node.js (v18 or higher)
- A Supabase account (free tier works)
- A Stripe account (for payments)
- Video hosting (Vimeo, YouTube, or cloud storage)

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Go to Settings > API and copy:
   - Project URL
   - Anon/public key

4. Update `supabase-config.js` with your credentials:
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

5. Go to SQL Editor in Supabase and run the SQL from `supabase-config.js` (the commented SQL at the bottom)

## Step 2: Set Up Stripe

1. Go to [stripe.com](https://stripe.com) and create an account
2. Get your publishable key from Dashboard > Developers > API keys
3. Update `stripe-config.js`:
```javascript
export const STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY'
```

4. **Create a backend endpoint** for creating checkout sessions:
   - You'll need a server (Node.js, Python, etc.) to handle Stripe webhooks
   - The endpoint should create a Stripe Checkout Session
   - Example endpoint: `/api/create-checkout-session`
   - Update `STRIPE_API_ENDPOINT` in `stripe-config.js` with your endpoint URL

## Step 3: Video Hosting

Choose one of these options:

### Option A: Vimeo (Recommended)
1. Upload videos to Vimeo
2. Get embed URLs for each video
3. Set `video_provider` to `'vimeo'` in lessons table
4. Store Vimeo video URLs in `video_url` field

### Option B: YouTube
1. Upload videos to YouTube (unlisted or private)
2. Get video IDs
3. Set `video_provider` to `'youtube'` in lessons table
4. Store YouTube URLs in `video_url` field

### Option C: Direct Video Hosting
1. Upload videos to cloud storage (AWS S3, Cloudflare R2, etc.)
2. Get direct URLs
3. Set `video_provider` to `'direct'` in lessons table
4. Store direct URLs in `video_url` field

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Add Course Data

Insert your courses and lessons into Supabase:

```sql
-- Example: Insert a course
INSERT INTO courses (name, description, bundle_name, lesson_count, price, stripe_price_id) 
VALUES ('Hello Starter Bundle', 'Begin your Portuguese journey', 'hello_starter', 8, 49.99, 'price_xxxxx');

-- Example: Insert lessons for the course
INSERT INTO lessons (course_id, title, description, video_url, video_provider, duration, lesson_order)
VALUES 
  ('course-id-here', 'Lesson 1: Greetings', 'Learn basic greetings', 'https://vimeo.com/123456789', 'vimeo', 15, 1),
  ('course-id-here', 'Lesson 2: Introductions', 'Learn how to introduce yourself', 'https://vimeo.com/123456790', 'vimeo', 18, 2);
  -- Add more lessons...
```

## Step 6: Set Up Stripe Products

1. In Stripe Dashboard, create products for each course
2. Create prices for each product
3. Update the `stripe_price_id` in your courses table with the Stripe price ID

## Step 7: Set Up Webhooks (Important!)

You need to handle Stripe webhooks to:
1. Mark purchases as completed when payment succeeds
2. Grant course access to users

Create a webhook endpoint that:
- Listens for `checkout.session.completed` events
- Updates the `purchases` table in Supabase
- Links the user to the purchased course

## Step 8: Configure Authentication

Supabase handles authentication automatically. Make sure:
- Email confirmation is configured in Supabase Auth settings
- Password reset emails are set up
- Redirect URLs are configured

## Step 9: Deploy

You can deploy this to:
- Netlify
- Vercel
- GitHub Pages (with some modifications)
- Your own server

Make sure to set environment variables for:
- Supabase URL and keys
- Stripe publishable key
- Backend API endpoint

## File Structure

```
├── index.html              # Homepage
├── courses.html            # Courses listing (with purchase)
├── signup.html             # User registration
├── signin.html             # User login
├── account.html            # User dashboard
├── course-player.html       # Video player for lessons
├── supabase-config.js      # Supabase configuration
├── auth.js                 # Authentication service
├── auth-handler.js         # Auth form handlers
├── course-service.js       # Course data service
├── courses-handler.js       # Courses page handler
├── account-handler.js      # Account dashboard handler
├── course-player-handler.js # Video player handler
├── stripe-config.js        # Stripe configuration
└── styles.css              # All styles
```

## Important Notes

1. **Backend Required**: You need a backend server to handle Stripe webhooks securely
2. **Video Storage**: Videos should be stored securely and access-controlled
3. **RLS Policies**: Supabase Row Level Security is enabled - adjust policies as needed
4. **Testing**: Test the full flow: signup → purchase → access course → watch video

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs
- Check the console for error messages





