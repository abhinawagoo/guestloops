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

## Product structure

### Customer (QR flow)

1. **QR scan** → Two options:
   - **Explore Menu / Services** — Restaurant: food menu; Hotel: spa, room service, breakfast, etc.
   - **Give Feedback & Win a Reward** — Incentivized feedback flow.

2. **Feedback flow** — Gamified, &lt; 45 sec:
   - Emoji ratings: overall, cleanliness, service, food/room quality, value.
   - Optional: “Anything we should improve?” (voice-to-text later).
   - AI review preview → one-click redirect to Google.

### Admin

- **AI Performance Dashboard** — Aspect scores (color: green/orange/red).
- **AI Insights** — Plain English (e.g. “Customers love food but complain about slow service at 7–9 PM”).
- **Review management** — Auto-reply modes and reply styles (Professional, Warm, Apologetic, Luxury, Casual).
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

**Supabase (optional):** For persistent auth and DB, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Run `supabase/migrations/001_tenants_profiles_venues.sql` in the Supabase SQL Editor to create `tenants`, `profiles`, `venues`, `venue_settings`, `feedback_submissions` with RLS so each org sees only its data. Enable Google OAuth in Supabase Auth providers and add the redirect URL `/auth/callback`. Sign-in then uses Supabase Auth; session is refreshed in middleware.

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
