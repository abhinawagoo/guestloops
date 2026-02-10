-- AI Growth Intelligence Layer: structured analysis per review/feedback, business-level Local Growth Score.
-- All scoped by tenant_id (business) for multi-tenant isolation. Run after 001–007.

-- Google reviews: extend with sentiment_score (0–100), emotion_label, local_seo_keywords
ALTER TABLE public.google_reviews
  ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  ADD COLUMN IF NOT EXISTS emotion_label TEXT,
  ADD COLUMN IF NOT EXISTS local_seo_keywords JSONB DEFAULT '[]';

COMMENT ON COLUMN public.google_reviews.sentiment_score IS 'AI-derived 0–100 sentiment strength';
COMMENT ON COLUMN public.google_reviews.emotion_label IS 'Single emotion label (e.g. satisfied, disappointed, delighted)';
COMMENT ON COLUMN public.google_reviews.local_seo_keywords IS 'Local SEO keywords extracted from review (e.g. best brunch, family dinner, cozy hotel)';

-- Feedback submissions: AI analysis columns (per submission, per business via tenant_id)
ALTER TABLE public.feedback_submissions
  ADD COLUMN IF NOT EXISTS sentiment_score INTEGER CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  ADD COLUMN IF NOT EXISTS emotion_label TEXT,
  ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS local_seo_keywords JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.feedback_submissions.sentiment_score IS 'AI-derived 0–100 sentiment from scores + text';
COMMENT ON COLUMN public.feedback_submissions.emotion_label IS 'Single emotion label from feedback';
COMMENT ON COLUMN public.feedback_submissions.topics IS 'Extracted topics (e.g. food quality, service, cleanliness)';
COMMENT ON COLUMN public.feedback_submissions.local_seo_keywords IS 'Local SEO keywords from optional_text / what_liked';
COMMENT ON COLUMN public.feedback_submissions.ai_analyzed_at IS 'When AI analysis was last run';

-- Business-level Local Growth Score (one row per tenant; overwrite on recompute for simplicity)
CREATE TABLE IF NOT EXISTS public.local_growth_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  review_velocity_score INTEGER NOT NULL DEFAULT 0 CHECK (review_velocity_score >= 0 AND review_velocity_score <= 100),
  avg_rating_score INTEGER NOT NULL DEFAULT 0 CHECK (avg_rating_score >= 0 AND avg_rating_score <= 100),
  reply_rate_score INTEGER NOT NULL DEFAULT 0 CHECK (reply_rate_score >= 0 AND reply_rate_score <= 100),
  sentiment_strength_score INTEGER NOT NULL DEFAULT 0 CHECK (sentiment_strength_score >= 0 AND sentiment_strength_score <= 100),
  keyword_coverage_score INTEGER NOT NULL DEFAULT 0 CHECK (keyword_coverage_score >= 0 AND keyword_coverage_score <= 100),
  trend_improvement_score INTEGER NOT NULL DEFAULT 0 CHECK (trend_improvement_score >= 0 AND trend_improvement_score <= 100),
  strengths JSONB NOT NULL DEFAULT '[]',
  weak_areas JSONB NOT NULL DEFAULT '[]',
  ai_recommendations JSONB NOT NULL DEFAULT '[]',
  seo_keyword_gaps JSONB NOT NULL DEFAULT '[]',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_local_growth_scores_tenant_id ON public.local_growth_scores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_local_growth_scores_computed_at ON public.local_growth_scores(computed_at DESC);

ALTER TABLE public.local_growth_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read local_growth_scores of own tenant"
  ON public.local_growth_scores FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

COMMENT ON TABLE public.local_growth_scores IS 'Per-tenant (business) Local Growth Score and AI insights; recomputed on demand or after new data';
