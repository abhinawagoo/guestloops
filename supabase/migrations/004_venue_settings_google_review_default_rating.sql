-- Add google_review_url and default_rating_style so settings persist in DB (onboarding + Settings panel).
ALTER TABLE public.venue_settings
  ADD COLUMN IF NOT EXISTS google_review_url TEXT,
  ADD COLUMN IF NOT EXISTS default_rating_style TEXT CHECK (default_rating_style IN ('star', 'emoji')),
  ADD COLUMN IF NOT EXISTS reply_tone TEXT,
  ADD COLUMN IF NOT EXISTS reply_instructions TEXT;

COMMENT ON COLUMN public.venue_settings.google_review_url IS 'URL for Google review / writereview page; used in feedback flow and onboarding';
COMMENT ON COLUMN public.venue_settings.default_rating_style IS 'Default display for rating questions: star or emoji';
COMMENT ON COLUMN public.venue_settings.reply_tone IS 'AI reply tone: friendly, professional, etc.';
COMMENT ON COLUMN public.venue_settings.reply_instructions IS 'Custom instructions for AI replies';
