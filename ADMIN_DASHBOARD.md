# Admin dashboard (`/admin.html`)

Owner-only statistics: completed purchases (weekly/monthly charts), new account sign-ups (weekly/monthly), and a table of purchases with email, course name, purchase time, account creation time, and country (when available).

## Vercel environment variables (required)

Add these in **Vercel** → Project → **Settings** → **Environment Variables**:

| Variable | Description |
|----------|-------------|
| `ADMIN_EMAILS` | Comma-separated list of admin emails (e.g. `owner@example.com`). Only these accounts can load stats. |
| `SUPABASE_ANON_KEY` | Supabase **anon** / **public** API key (same as in `supabase-config.js`). Used only to validate the user’s JWT. |
| `SUPABASE_URL` | Already set for payments. |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set. Used server-side to read all purchases and list users. |

Redeploy after adding or changing variables.

## How to open

- **Production:** `https://your-domain.com/admin.html`
- **Local:** The admin API lives on Vercel (`/api/admin-stats`). Plain `vite` dev server has no API — use **`vercel dev`** from the project folder, or test on the deployed site.

## Security

- Access is enforced on the server: your session token must belong to an email listed in `ADMIN_EMAILS`.
- The dashboard is marked **noindex** for search engines.
- Do not link `/admin.html` from public pages unless you want it discoverable.

## Country column

Supabase Auth does not store country by default. The dashboard shows country only if you save it under `user_metadata.country` or `user_metadata.location` (e.g. optional field on signup or profile). Otherwise it shows "—".

## API

- `GET /api/admin-stats` with header `Authorization: Bearer <Supabase access_token>` returns JSON for charts and the purchase table.
