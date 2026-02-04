# Google Review Growth System for Hospitality

**Scan QR → fun 30-second feedback → AI turns it into a high-quality Google review → one click post → business gets analytics + AI insights.**

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Local Supabase + OPENAI_API_KEY
npm run dev
```

**Env files (all from `.env.example`):**

- **Local:** `.env.local` — used by `npm run dev` (Supabase Local project).
- **Testing:** `.env.test` — optional; use for local tests or point Vercel Preview to a Test Supabase project.
- **Production:** set in Vercel (Settings → Environment Variables), not in a file (Supabase Production project).

---

## Get production working first

Do this once so your Vercel-hosted app can sign up users and save feedback.

1. **Create one Supabase project** (or use an existing one) at [supabase.com/dashboard](https://supabase.com/dashboard). This will be your **production** database.

2. **Run both migrations** in that project:
   - Open the project → **SQL Editor** → New query.
   - Copy **all** of `supabase/migrations/001_tenants_profiles_venues.sql` → paste → **Run**.
   - New query again → copy **all** of `supabase/migrations/002_feedback_review_outcome.sql` → paste → **Run**.

3. **Set Vercel env vars** (Production):
   - Vercel → your project → **Settings** → **Environment Variables**.
   - Add for **Production** only:
     - `NEXT_PUBLIC_SUPABASE_URL` = Project URL (Supabase → Settings → API).
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key.
     - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (keep secret).
   - Optional: `OPENAI_API_KEY` for AI review generation.
   - Save and **redeploy** (Deployments → ⋮ on latest → Redeploy).

4. **Auth URL configuration** in Supabase:
   - Supabase → **Authentication** → **URL Configuration**.
   - **Site URL:** Set to your default app URL. For production use **`https://guestloops.com`** (main domain). For local use `http://localhost:3000` or `http://localhost:3001` (this app runs on 3001 by default). No wildcards; used when a redirect URL isn’t specified and in email templates.
   - **Redirect URLs:** Add each allowed callback (one per line). Examples:
     - Production: **`https://guestloops.com/auth/callback`**
     - Local: `http://localhost:3000/auth/callback` or `http://localhost:3001/auth/callback`
   - Save.

5. **Test:** Open your Vercel URL → **Sign up** (create account). If signup succeeds and you can sign in, production is working. Add Local/Testing later if you want.

---

- **Home:** [http://localhost:3001](http://localhost:3001)
- **QR (restaurant):** [http://localhost:3001/q/demo-restaurant](http://localhost:3001/q/demo-restaurant)
- **QR (hotel):** [http://localhost:3001/q/demo-hotel](http://localhost:3001/q/demo-hotel)
- **Tenant dashboard (demo):** [http://localhost:3001/admin?tenant=demo](http://localhost:3001/admin?tenant=demo)
- **Platform admin (super admin):** [http://localhost:3001/superadmin?host=superadmin](http://localhost:3001/superadmin?host=superadmin)

## Environments (Production, Local, Testing)

Use **three separate Supabase projects** so production data stays isolated and you can test safely.

| Environment | Where it runs | Supabase project | Env file / config |
|-------------|----------------|------------------|-------------------|
| **Production** | Vercel (main domain) | Create “Production” project in Supabase | Vercel → Settings → Environment Variables → **Production** |
| **Local** | Your machine (`npm run dev`) | Create “Local” or “Dev” project in Supabase | `.env.local` (copy from `.env.example`) |
| **Testing** | Vercel Preview branches or local tests | Create “Testing” / “Staging” project in Supabase | Vercel → **Preview** env vars, or `.env.test` when running tests |

**Setup per environment:**

1. **Create three projects** in [Supabase Dashboard](https://supabase.com/dashboard) (e.g. `guestloops-prod`, `guestloops-local`, `guestloops-test`).
2. **Run migrations in each project:** SQL Editor → run `001_tenants_profiles_venues.sql`, then `002_feedback_review_outcome.sql` (see [Database setup](#database-setup-supabase) below).
3. **Wire env vars:**
   - **Local:** `cp .env.example .env.local` and paste the **Local** Supabase URL + anon key + service role key.
   - **Production:** Vercel → Project → Settings → Environment Variables. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (and `OPENAI_API_KEY` etc.) for **Production**.
   - **Testing:** Same variables for **Preview** in Vercel (so preview deployments use the test Supabase project), or in `.env.test` for local test runs.
4. **Auth URL configuration (Supabase Auth):** In each project → **Authentication** → **URL Configuration**:
   - **Site URL:** Default redirect and email template base. Use production URL for prod project (e.g. **`https://guestloops.com`**), or for local project use `http://localhost:3000` or `http://localhost:3001` (this app uses port 3001 by default).
   - **Redirect URLs:** Add each allowed callback:
     - Production: **`https://guestloops.com/auth/callback`**
     - Local: `http://localhost:3000/auth/callback` or `http://localhost:3001/auth/callback`
     - Testing: `https://your-preview-url.vercel.app/auth/callback`

Never use the production Supabase project for local or testing.

## Database setup (Supabase)

**Required for signup and feedback.** If you see errors like:

- **"Could not find the table 'public.tenants' in the schema cache"** → Signup will fail (Vercel/production).
- **"Could not find the table 'public.feedback_submissions' in the schema cache"** → Admin reviews and submissions will fail.

Your Supabase project doesn’t have the tables yet. Run the migrations on **the same Supabase project your app uses** (the one in `NEXT_PUBLIC_SUPABASE_URL` / Vercel env vars).

**Production / Vercel:** Use the Supabase project that your Vercel project’s environment variables point to. Run the two migrations below in that project’s SQL Editor so signup and feedback work in production.

**Option A – Supabase Dashboard (recommended)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select the project used by your app (or Vercel) → **SQL Editor**.
2. Run **Migration 1:** open `supabase/migrations/001_tenants_profiles_venues.sql`, copy its **entire** contents, paste into a new query, and click **Run**. This creates `tenants`, `profiles`, `venues`, `venue_settings`, `feedback_submissions`, and RLS.
3. Run **Migration 2:** open `supabase/migrations/002_feedback_review_outcome.sql`, copy its contents, paste into a new query, and click **Run**. This adds `generated_review_text` and `review_outcome` to `feedback_submissions`.

**Option B – Supabase CLI**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF   # if not linked
npx supabase db push
```

After running both migrations, **Signup**, **Reviews**, and **Recent feedback** will work (locally and on Vercel).

## Push to GitHub

1. **Create a new repository** on GitHub (e.g. `guestloops` or `growth-system`). Do **not** initialize with a README (you already have one).

2. **Add the remote and push** (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

```bash
cd growth-system   # if you're in the parent folder
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

Or with SSH:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

`.env*` is in `.gitignore`, so your secrets (Supabase, OpenAI) are not pushed. Set them in your deployment (Vercel, etc.) or in GitHub Actions if needed.

## SEO and discoverability

The app exposes standard routes and metadata for search and AI:

- **`/robots.txt`** — Generated from `app/robots.ts`. Allows crawlers for public pages; disallows `/admin`, `/api`, `/auth`, `/superadmin`. Explicit **allow** for AI/LLM crawlers (GPTBot, Claude-Web, PerplexityBot, etc.) so the site can be indexed and cited in AI search.
- **`/sitemap.xml`** — Generated from `app/sitemap.ts`. Lists public URLs (home, signin, signup, demo QR pages) with `lastModified`, `changeFrequency`, and `priority`.
- **Metadata** — Root layout sets `metadataBase`, Open Graph, Twitter card, `robots` (index, follow), canonical URL, and keywords.
- **JSON-LD** — Schema.org `Organization` and `WebSite` in the layout for rich results and LLM understanding.

Set **`NEXT_PUBLIC_APP_URL`** (e.g. `https://guestloops.com`) in production so sitemap and Open Graph use the correct canonical URL.

## Product structure

### Customer (QR flow)

1. **QR scan** → Two options:
   - **Explore Menu / Services** — Restaurant: food menu; Hotel: spa, room service, breakfast, etc.
   - **Give Feedback & Win a Reward** — Incentivized feedback flow.

2. **Feedback flow** — Gamified, &lt; 45 sec:
   - Emoji ratings: overall, cleanliness, service, food/room quality, value.
   - Optional: “Anything we should improve?” (voice-to-text later).
   - AI review preview → one-click redirect to Google.
   - **Submission:** All feedback is saved to Supabase `feedback_submissions` (via `POST /api/feedback/submit`). Happy path (avg ≥ 4) stores `generated_review_text` and `review_outcome: google_redirect`; private feedback stores `review_outcome: private`. Google review link uses `placeid` when venue has `google_place_id` (writereview URL).

### Admin

- **AI Performance Dashboard** — Aspect scores (color: green/orange/red).
- **AI Insights** — Plain English (e.g. “Customers love food but complain about slow service at 7–9 PM”).
- **Review management** — View feedback submissions and generated reviews; **Generate AI reply** using venue tone/instructions (Settings → AI reply style); copy reply to post on Google. Connect Google Business Profile API later for live reviews and one-click reply.
- **Retention** — Phone + visit context for personalized offers and apology coupons.

## Multi-tenant and subdomains

The app is **multi-tenant**: each hotel or restaurant is a **tenant** with its own subdomain and venues.

- **Tenant subdomain:** `{slug}.guestloops.com` — e.g. `demo.guestloops.com` → that tenant’s admin (dashboard, settings, reviews). Each tenant can create a profile and manage their venues.
- **Platform admin subdomain:** `admin.guestloops.com` (or `superadmin.guestloops.com`) → **super admin dashboard** where you see all tenants, plans, and status. Manage plans (Free, Starter, Pro, Enterprise) and suspend/activate tenants.
- **App / main domain:** **guestloops.com** → landing, sign up, and “Open your dashboard” (redirects to tenant subdomain).

**Local dev (no subdomains):**

- Use `?tenant=demo` to act as the demo tenant: [http://localhost:3001/admin?tenant=demo](http://localhost:3001/admin?tenant=demo). The middleware sets a cookie so API calls are tenant-scoped.
- Use `?host=superadmin` to open platform admin: [http://localhost:3001/superadmin?host=superadmin](http://localhost:3001/superadmin?host=superadmin).

**Data model:** `src/types/tenant.ts` (Tenant, Plan, TenantStatus), `src/data/tenants.ts` (in-memory store; replace with Supabase/DB for production). Venues belong to a tenant (`Venue.tenantId`). Admin APIs verify venue ownership via `getVenueForTenant(tenantId, venueId)`.

**Sign up:** Hotels and restaurants sign up at `/signup` with: organization name (hotel/restaurant name), first name, last name, email, password, mobile (with country selector), business type (restaurant/hotel/both), and business country. `POST /api/app/signup` accepts these fields and creates a tenant (in-memory or Supabase when configured). After signup they can sign in at `/signin` with **Google** or **email/password**. Each organization has separate feedback, menu, and settings (per-tenant isolation).

**Supabase (optional):** For persistent auth and DB, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for signup and feedback submit). Run `supabase/migrations/001_tenants_profiles_venues.sql` and `002_feedback_review_outcome.sql` in the Supabase SQL Editor to create tables and add `generated_review_text`, `review_outcome` to `feedback_submissions`. Enable Google OAuth in Supabase Auth and add redirect URL `/auth/callback`. Sign-in uses Supabase Auth; session is refreshed in middleware.

**Scalable multi-tenant (concurrent users):**

- **Tenant resolution cache** (`src/lib/tenant-cache.ts`): In-memory TTL cache (90s, max 1000 entries) for slug→tenant and id→tenant. Reduces DB load when many requests hit the same tenant; safe for concurrent requests.
- **Slug normalization**: Slugs are lowercased and trimmed everywhere (`normalizeTenantSlug`). DB has a unique index on `LOWER(slug)` (migration `005_tenants_slug_lowercase_unique.sql`) so one tenant per slug (case-insensitive). Use `?tenant=slug` and nav links keep the same slug so no redirect loops.
- **Admin context helper** (`src/lib/require-admin-tenant.ts`): `requireAdminTenant()` returns `{ tenant, user, tenantId, tenantSlug }` only when the authenticated user’s profile belongs to the requested tenant. Use in admin API routes and return 403 when null.
- **RLS**: All tenant-scoped tables (venues, venue_settings, feedback_submissions) use Row Level Security so each request only sees data for the user’s tenant. No cross-tenant data leakage.
- **Stateless request flow**: Middleware sets `x-tenant-slug` and `x-tenant-id` from query/cookie/subdomain; layout and APIs read from headers. No shared mutable state; safe for horizontal scaling.

## Tech stack

- **Frontend:** Next.js (App Router), Tailwind, shadcn/ui, Framer Motion.
- **Backend:** Supabase (Auth, DB, Storage) — optional; demo uses in-memory.
- **AI:** OpenAI (review generation); prompts in `src/lib/prompts/`.
- **Analytics schema:** `src/lib/analytics/schema.ts`.

## Selling

See [docs/SELLING.md](docs/SELLING.md) for market problems, pricing, and one-line pitch.

**Don’t sell as “AI Feedback System”. Sell as “Google Review Growth System for Hospitality”.**

## Cursor workflow

- **Component generation:** “Build a mobile-first QR feedback flow with emoji sliders, progress bar, image upload, and AI review preview.”
- **Refactors:** “Refactor this component to reduce steps and optimize conversion.”
- **AI prompts:** Versioned in `src/lib/prompts/` (review_generator, insight_analyzer, reply_generator).
