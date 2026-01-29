# Backend Server Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `stripe` - Stripe payment processing
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `nodemon` - Auto-restart server during development (dev dependency)

### 2. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your credentials:

   **Get Stripe Secret Key:**
   - Go to https://dashboard.stripe.com/apikeys
   - Copy your **Secret key** (starts with `sk_live_` or `sk_test_`)
   - Add it to `.env` as `STRIPE_SECRET_KEY`

   **Get Supabase Service Role Key:**
   - Go to https://app.supabase.com/project/_/settings/api
   - Copy the **service_role** key (NOT the anon key - this is secret!)
   - Add it to `.env` as `SUPABASE_SERVICE_ROLE_KEY`

   **Get Supabase URL:**
   - Same page as above
   - Copy the **Project URL**
   - Add it to `.env` as `SUPABASE_URL`

   **Get Stripe Webhook Secret (for production):**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Create a webhook endpoint pointing to: `https://your-domain.com/api/webhook`
   - Copy the webhook signing secret
   - Add it to `.env` as `STRIPE_WEBHOOK_SECRET`

### 3. Update Frontend Configuration

In `stripe-config.js`, update the endpoint URL:

**For local development:**
```javascript
export const STRIPE_API_ENDPOINT = 'http://localhost:3000/api/create-checkout-session'
```

**For production:**
```javascript
export const STRIPE_API_ENDPOINT = 'https://your-domain.com/api/create-checkout-session'
```

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev:server
```

**Production mode:**
```bash
npm run server
```

The server will start on port 3000 (or the port specified in your `.env` file).

### 5. Test the Setup

1. Make sure your frontend is running (Vite dev server)
2. Try to purchase a course
3. You should be redirected to Stripe Checkout
4. After payment, you'll be redirected back to the success page

## API Endpoints

### POST `/api/create-checkout-session`
Creates a Stripe checkout session for course purchase.

**Request Body:**
```json
{
  "courseId": "uuid-of-course",
  "userId": "uuid-of-user"
}
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/webhook`
Handles Stripe webhook events (payment completion, etc.)

**Note:** For webhooks to work in production, you need to:
1. Deploy your server with a public URL
2. Add the webhook endpoint in Stripe Dashboard
3. Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhook`

### GET `/api/health`
Health check endpoint to verify server is running.

## Deployment Options

### Option 1: Vercel (Recommended for Serverless)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add environment variables in Vercel dashboard
4. Update `stripe-config.js` with your Vercel URL

### Option 2: Railway

1. Connect your GitHub repo to Railway
2. Add environment variables
3. Railway will auto-deploy

### Option 3: Heroku

1. Install Heroku CLI
2. Create app: `heroku create`
3. Set environment variables: `heroku config:set KEY=value`
4. Deploy: `git push heroku main`

### Option 4: Your Own Server

1. Install Node.js on your server
2. Clone your repository
3. Install dependencies: `npm install`
4. Set up environment variables
5. Use PM2 to run: `pm2 start server.js`

## Testing Webhooks Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
# Then run:
stripe listen --forward-to localhost:3000/api/webhook
```

This will give you a webhook signing secret to use in your `.env` file for local testing.

## Troubleshooting

**Server won't start:**
- Check that port 3000 is not in use
- Verify all environment variables are set
- Check console for error messages

**Checkout session creation fails:**
- Verify Stripe secret key is correct
- Check that course exists in Supabase
- Ensure Supabase service role key has proper permissions

**Webhook not working:**
- Verify webhook secret is correct
- Check that webhook endpoint URL is accessible
- Use Stripe Dashboard > Webhooks to see event logs

## Security Notes

- Never commit `.env` file to git (it's in `.gitignore`)
- Use `service_role` key only on backend, never in frontend
- Use Stripe test keys during development
- Switch to live keys only when ready for production




