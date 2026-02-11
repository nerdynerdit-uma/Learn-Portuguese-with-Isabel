# Vercel environment variables (required for payments & contact)

In **Vercel Dashboard** → your project → **Settings** → **Environment Variables**, add:

| Name | Description |
|------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (live: `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Developers → Webhooks. Add endpoint URL: `https://learnportuguesewithisabel.com/api/webhook` |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Settings → API) |
| `EMAIL_USER` | Gmail address (for contact form) |
| `EMAIL_PASSWORD` | Gmail App Password (for contact form) |

After adding variables, **redeploy** the project so the API routes use them.
