# Vercel environment variables (required for payments & contact)

In **Vercel Dashboard** → your project → **Settings** → **Environment Variables**, add:

| Name | Description |
|------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (live: `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Developers → Webhooks. Add endpoint URL: `https://learnportuguesewithisabel.com/api/webhook` |
| `SUPABASE_URL` | **Must be exactly** your Supabase project URL (e.g. `https://xxxxx.supabase.co`). Same project as in `supabase-config.js`. Get from Supabase → Settings → API → Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (not anon). Supabase → Settings → API → Project API keys → `service_role` (secret). |
| `EMAIL_USER` | Gmail address (for contact form) |
| `EMAIL_PASSWORD` | Gmail App Password (for contact form) |

**Important:** If checkout shows "Course not found", the API cannot see your courses. Check:
1. `SUPABASE_URL` is the **exact** URL of the project where your courses table lives (same as in `supabase-config.js`).
2. `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key from that same project (Settings → API → service_role).
3. Redeploy after changing any variable.
