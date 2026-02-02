# Google Review Growth System for Hospitality

**Scan QR → fun 30-second feedback → AI turns it into a high-quality Google review → one click post → business gets analytics + AI insights.**

## Quick start

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY for AI reviews + custom questions (Settings)
npm run dev
```

- **Home:** [http://localhost:3001](http://localhost:3001)
- **QR (restaurant):** [http://localhost:3001/q/demo-restaurant](http://localhost:3001/q/demo-restaurant)
- **QR (hotel):** [http://localhost:3001/q/demo-hotel](http://localhost:3001/q/demo-hotel)
- **Tenant dashboard (demo):** [http://localhost:3001/admin?tenant=demo](http://localhost:3001/admin?tenant=demo)
- **Platform admin (super admin):** [http://localhost:3001/superadmin?host=superadmin](http://localhost:3001/superadmin?host=superadmin)

## Database setup (Supabase)

If you see **"Could not find the table 'public.feedback_submissions' in the schema cache"** (PGRST205), your Supabase project doesn’t have the tables yet. Apply the migrations:

**Option A – Supabase Dashboard (recommended)**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **SQL Editor**.
2. Run **Migration 1:** open `supabase/migrations/001_tenants_profiles_venues.sql`, copy its full contents, paste into a new query, and click **Run**. This creates `tenants`, `profiles`, `venues`, `venue_settings`, `feedback_submissions`, and RLS.
3. Run **Migration 2:** open `supabase/migrations/002_feedback_review_outcome.sql`, copy its contents, paste into a new query, and click **Run**. This adds `generated_review_text` and `review_outcome` to `feedback_submissions`.

**Option B – Supabase CLI**

```bash
npx supabase link --project-ref YOUR_PROJECT_REF   # if not linked
npx supabase db push
```

After running the migrations, admin **Reviews** and **Recent feedback** (submissions) will work.

## Push to GitHub

1. **Create a new repository** on GitHub (e.g. `guestloop` or `growth-system`). Do **not** initialize with a README (you already have one).

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

- **Tenant subdomain:** `{slug}.yourdomain.com` — e.g. `demo.yourdomain.com` → that tenant’s admin (dashboard, settings, reviews). Each tenant can create a profile and manage their venues.
- **Platform admin subdomain:** `admin.yourdomain.com` (or `superadmin.yourdomain.com`) → **super admin dashboard** where you see all tenants, plans, and status. Manage plans (Free, Starter, Pro, Enterprise) and suspend/activate tenants.
- **App / main domain:** `app.yourdomain.com` or `yourdomain.com` → landing, sign up, and “Open your dashboard” (redirects to tenant subdomain).

**Local dev (no subdomains):**

- Use `?tenant=demo` to act as the demo tenant: [http://localhost:3001/admin?tenant=demo](http://localhost:3001/admin?tenant=demo). The middleware sets a cookie so API calls are tenant-scoped.
- Use `?host=superadmin` to open platform admin: [http://localhost:3001/superadmin?host=superadmin](http://localhost:3001/superadmin?host=superadmin).

**Data model:** `src/types/tenant.ts` (Tenant, Plan, TenantStatus), `src/data/tenants.ts` (in-memory store; replace with Supabase/DB for production). Venues belong to a tenant (`Venue.tenantId`). Admin APIs verify venue ownership via `getVenueForTenant(tenantId, venueId)`.

**Sign up:** Hotels and restaurants sign up at `/signup` with: organization name (hotel/restaurant name), first name, last name, email, password, mobile (with country selector), business type (restaurant/hotel/both), and business country. `POST /api/app/signup` accepts these fields and creates a tenant (in-memory or Supabase when configured). After signup they can sign in at `/signin` with **Google** or **email/password**. Each organization has separate feedback, menu, and settings (per-tenant isolation).

**Supabase (optional):** For persistent auth and DB, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` for signup and feedback submit). Run `supabase/migrations/001_tenants_profiles_venues.sql` and `002_feedback_review_outcome.sql` in the Supabase SQL Editor to create tables and add `generated_review_text`, `review_outcome` to `feedback_submissions`. Enable Google OAuth in Supabase Auth and add redirect URL `/auth/callback`. Sign-in uses Supabase Auth; session is refreshed in middleware.

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
