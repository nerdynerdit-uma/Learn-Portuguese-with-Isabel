# Email Setup Guide for Supabase

## "Error sending recovery email" on Forgot Password

This message means **Supabase’s default email service failed**. It does not send to all addresses and is rate-limited. You must configure **Custom SMTP** so password reset (and optional confirmation) emails work.

**Fix (required for production):**

1. Open [Supabase Dashboard](https://app.supabase.com) → your project  
2. Go to **Project Settings** (gear) → **Authentication**  
3. Scroll to **SMTP Settings**  
4. Enable **Custom SMTP** and fill in your provider, for example:
   - **Gmail:** Host `smtp.gmail.com`, Port `587`, your Gmail + [App Password](https://myaccount.google.com/apppasswords), Sender email = that Gmail  
   - **SendGrid / Mailgun / etc.:** Use their SMTP host, port, user, password, and sender  
5. **Save**

Then test Forgot Password again on the live site. Redirect URLs (e.g. `https://learnportuguesewithisabel.com/reset-password.html`) must already be in **Authentication → URL Configuration → Redirect URLs**.

---

## Problem
Emails are not being sent for:
- Account confirmation
- Password reset

## Solution Options

### Option 1: Disable Email Confirmation (Quick Fix for Testing)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Providers** (left sidebar)
4. Click on **Email** provider
5. Find **"Confirm email"** toggle
6. **Turn it OFF**
7. Click **Save**

Now users can sign in immediately without email confirmation.

**Note:** For password reset, you'll still need to configure SMTP (see Option 2).

---

### Option 2: Configure SMTP for Production (Recommended)

Supabase has a built-in email service with limits, but you can configure custom SMTP.

#### Step 1: Configure SMTP in Supabase

1. Go to **Project Settings** → **Auth** (or **Authentication** → **Settings**)
2. Scroll to **SMTP Settings**
3. Enable **"Enable Custom SMTP"**
4. Enter your SMTP details:

**For Gmail:**
- SMTP Host: `smtp.gmail.com`
- SMTP Port: `587`
- SMTP User: `your-email@gmail.com`
- SMTP Password: [Generate App Password](https://myaccount.google.com/apppasswords)
- Sender Email: `your-email@gmail.com`
- Sender Name: `Learn Portuguese with Isabel`

**For other providers (SendGrid, Mailgun, etc.):**
- Use their SMTP credentials

5. Click **Save**

#### Step 2: Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - **Confirm signup** - Email confirmation template
   - **Magic Link** - Magic link template  
   - **Change Email Address** - Email change template
   - **Reset Password** - Password reset template
   - **Invite user** - User invitation template

3. Make sure **redirect URLs** are set correctly:
   - Site URL: `http://localhost:5173` (for local development)
   - Redirect URLs: Add `http://localhost:5173/**` for local testing

#### Step 3: Update Redirect URLs for Production (required for live site)

If "Forgot Password" fails on the live site with "Error sending recovery email", Supabase is rejecting the redirect URL. Fix it:

1. Go to [Supabase Dashboard](https://app.supabase.com) → your project
2. Open **Authentication** → **URL Configuration**
3. Set **Site URL** to: `https://learnportuguesewithisabel.com`
4. Under **Redirect URLs**, add (one per line):
   - `https://learnportuguesewithisabel.com/reset-password.html`
   - `https://learnportuguesewithisabel.com/**`
5. Click **Save**

Without these, password reset and email confirmation links from the live site will not work.

---

### Option 3: Use Supabase Built-in Email (Free Tier - Limited)

Supabase provides a built-in email service with limitations:
- 3 emails per hour on free tier
- 4 emails per hour on pro tier

For testing, this might work if you:
1. Go to **Authentication** → **Settings**
2. Make sure **"Enable email confirmations"** is ON
3. Check that redirect URLs are configured
4. Wait a few minutes between tests (due to rate limits)

---

## Quick Test After Setup

1. **Test Sign Up:**
   - Go to `http://localhost:5173/signup.html`
   - Create an account
   - Check your email (and spam folder)

2. **Test Password Reset:**
   - Go to `http://localhost:5173/signin.html`
   - Click "Forgot your password?"
   - Enter your email
   - Check your email for reset link

---

## Troubleshooting

### Emails go to spam
- Configure SPF/DKIM records for your domain (if using custom SMTP)
- Use a reputable email service (SendGrid, Mailgun)
- Check spam folder

### "Email rate limit exceeded"
- Supabase free tier has limits
- Wait a few hours or upgrade plan
- Use custom SMTP for higher limits

### Redirect URLs not working
- Make sure redirect URLs are whitelisted in Supabase
- Format: `http://localhost:5173/**` (with `/**` at the end)
- For production: `https://yourdomain.com/**`

### Email confirmation link doesn't work
- Check redirect URL is correct
- Make sure the link isn't expired (default: 1 hour)
- Check browser console for errors

---

## Recommended: Disable Confirmation for Development

For local development, I recommend **Option 1** (disable email confirmation):

1. Faster testing
2. No email setup needed
3. Can enable later for production

Then set up proper SMTP when ready for production.
