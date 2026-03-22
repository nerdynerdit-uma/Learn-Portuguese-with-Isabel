# Vercel environment variables (required for payments & contact)

In **Vercel Dashboard** → your project → **Settings** → **Environment Variables**, add:

| Name | Description |
|------|-------------|
| `STRIPE_SECRET_KEY` | Stripe **secret** key (live: `sk_live_...`). Developers → API keys. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe **publishable** key (live: `pk_live_...`). Same account as `STRIPE_SECRET_KEY`. Injected at build time. Checkout uses the server-returned **session URL** for redirect (no key mismatch); this key is still used if a fallback path runs. |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard → Developers → Webhooks. Add endpoint URL: `https://learnportuguesewithisabel.com/api/webhook` (use the **Signing secret** from that endpoint after you switch Stripe accounts). |
| `SUPABASE_URL` | **Must be exactly** your Supabase project URL (e.g. `https://xxxxx.supabase.co`). Same project as in `supabase-config.js`. Get from Supabase → Settings → API → Project URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase **service_role** key (not anon). Supabase → Settings → API → Project API keys → `service_role` (secret). Used by admin API to validate your session and read data. |
| `ADMIN_EMAILS` | *(Optional.)* Comma-separated emails allowed to use **`/admin.html`**. If omitted, the API defaults to **`learnportuguesewithisabel@gmail.com`**. Set this to add co-admins or use a different owner email. |
| `EMAIL_USER` | Gmail address (for contact form) |
| `EMAIL_PASSWORD` | Gmail App Password (for contact form) |

**Important:** If checkout shows "Course not found", the API cannot see your courses. Check:
1. `SUPABASE_URL` is the **exact** URL of the project where your courses table lives (same as in `supabase-config.js`).
2. `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key from that same project (Settings → API → service_role).
3. Redeploy after changing any variable.

---

## Stripe account change (new Dashboard account)

Use **all** of these from the **same** Stripe account:

1. `STRIPE_SECRET_KEY` — secret key  
2. `VITE_STRIPE_PUBLISHABLE_KEY` — publishable key (browser checkout must match the secret key account)  
3. `STRIPE_WEBHOOK_SECRET` — create a new webhook on the new account pointing to `https://learnportuguesewithisabel.com/api/webhook`, then paste the new signing secret  

Supabase does **not** store Stripe API keys for checkout; the Vercel serverless API reads Stripe from Vercel env vars only.

After updating variables, trigger a **new deployment** so `VITE_STRIPE_PUBLISHABLE_KEY` is baked into the built JS.
