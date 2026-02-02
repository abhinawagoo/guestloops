-- Multi-tenant schema: each organization (hotel/restaurant) has separate feedback, menu, settings.
-- Run in Supabase SQL Editor or via supabase db push.

-- Tenants (organizations)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('hotel', 'restaurant', 'both')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended', 'cancelled')),
  owner_email TEXT NOT NULL,
  owner_first_name TEXT,
  owner_last_name TEXT,
  owner_mobile TEXT,
  owner_country_code TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles: link auth.users to tenant (first name, last name, mobile, role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  mobile TEXT,
  country_code TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venues belong to a tenant
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('restaurant', 'hotel')),
  google_place_id TEXT,
  reward_cta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Venue settings (menu, services, UI text, custom questions) — one row per venue
CREATE TABLE IF NOT EXISTS public.venue_settings (
  venue_id UUID PRIMARY KEY REFERENCES public.venues(id) ON DELETE CASCADE,
  show_menu BOOLEAN NOT NULL DEFAULT true,
  show_services BOOLEAN NOT NULL DEFAULT true,
  ui_text JSONB NOT NULL DEFAULT '{}',
  custom_questions JSONB NOT NULL DEFAULT '[]',
  menu_items JSONB NOT NULL DEFAULT '[]',
  service_items JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feedback submissions (per venue; tenant_id for RLS)
CREATE TABLE IF NOT EXISTS public.feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  mobile TEXT,
  scores JSONB NOT NULL DEFAULT '{}',
  text_answers JSONB DEFAULT '{}',
  yes_no_answers JSONB DEFAULT '{}',
  optional_text TEXT,
  image_urls TEXT[],
  recent_order_items TEXT[],
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_venues_tenant_id ON public.venues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_venue_id ON public.feedback_submissions(venue_id);
CREATE INDEX IF NOT EXISTS idx_feedback_tenant_id ON public.feedback_submissions(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- RLS: each organization sees only its own data
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_submissions ENABLE ROW LEVEL SECURITY;

-- Tenant: users can read/update only their tenant (via profile)
CREATE POLICY "Users can read own tenant"
  ON public.tenants FOR SELECT
  USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Allow public to read tenant id/slug for subdomain resolution (middleware)
CREATE POLICY "Allow public read tenant for resolution"
  ON public.tenants FOR SELECT
  USING (true);

CREATE POLICY "Users can update own tenant"
  ON public.tenants FOR UPDATE
  USING (
    id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Profiles: users can read/update own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Venues: users can CRUD only venues of their tenant
CREATE POLICY "Users can read venues of own tenant"
  ON public.venues FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert venues for own tenant"
  ON public.venues FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update venues of own tenant"
  ON public.venues FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete venues of own tenant"
  ON public.venues FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Venue settings: same tenant scope
CREATE POLICY "Users can read venue_settings of own tenant"
  ON public.venue_settings FOR SELECT
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can insert venue_settings for own tenant venues"
  ON public.venue_settings FOR INSERT
  WITH CHECK (
    venue_id IN (SELECT id FROM public.venues WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update venue_settings of own tenant"
  ON public.venue_settings FOR UPDATE
  USING (
    venue_id IN (SELECT id FROM public.venues WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  );

-- Feedback: users can read/insert for their tenant (insert for customer submissions may use service role or anon with RLS bypass for public QR)
CREATE POLICY "Users can read feedback of own tenant"
  ON public.feedback_submissions FOR SELECT
  USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Allow anon insert for public QR feedback (optional: restrict by venue_id and rate limit in app)
CREATE POLICY "Allow insert feedback for any venue"
  ON public.feedback_submissions FOR INSERT
  WITH CHECK (true);

-- Service role can do everything; signup creates tenant + profile via service role or a secure function.
-- Optional: trigger to create profile on first signup (custom claim or app logic).
COMMENT ON TABLE public.tenants IS 'One row per organization (hotel/restaurant). Each has separate venues, settings, feedback.';
