-- Google Business Profile (GBP) integration: OAuth tokens, venue→location mapping, synced reviews, AI analysis, replies.
-- Run after 001–006. Requires Google OAuth (business.manage scope) for list reviews and updateReply.

-- OAuth tokens per tenant (one connection per tenant; can list locations and pick one per venue).
CREATE TABLE IF NOT EXISTS public.google_oauth_tokens (
  tenant_id UUID PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Link venue to a GBP location (account_id and location_id from Google API).
CREATE TABLE IF NOT EXISTS public.venue_gbp_locations (
  venue_id UUID PRIMARY KEY REFERENCES public.venues(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gbp_account_id TEXT NOT NULL,
  gbp_location_id TEXT NOT NULL,
  gbp_location_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(gbp_account_id, gbp_location_id)
);

-- Synced Google reviews (from GBP API); AI analysis stored per review.
CREATE TABLE IF NOT EXISTS public.google_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  gbp_review_name TEXT NOT NULL,
  reviewer_display_name TEXT,
  star_rating INTEGER,
  comment TEXT,
  review_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  gbp_updated_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  topics JSONB DEFAULT '[]',
  trend_tags JSONB DEFAULT '[]',
  ai_analyzed_at TIMESTAMPTZ,
  UNIQUE(venue_id, gbp_review_name)
);

CREATE INDEX IF NOT EXISTS idx_google_reviews_venue_id ON public.google_reviews(venue_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_tenant_id ON public.google_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_google_reviews_updated ON public.google_reviews(updated_at DESC);

-- RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_gbp_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage google_oauth_tokens of own tenant"
  ON public.google_oauth_tokens FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage venue_gbp_locations of own tenant"
  ON public.venue_gbp_locations FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage google_reviews of own tenant"
  ON public.google_reviews FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

COMMENT ON TABLE public.google_oauth_tokens IS 'Google OAuth tokens for Business Profile API (list reviews, post reply)';
COMMENT ON TABLE public.venue_gbp_locations IS 'Maps venue to GBP account/location for syncing reviews';
COMMENT ON TABLE public.google_reviews IS 'Synced Google reviews with AI sentiment/topics/trends and reply state';
