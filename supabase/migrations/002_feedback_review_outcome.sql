-- Store AI-generated review text and outcome (google_redirect vs private) for each submission.
ALTER TABLE public.feedback_submissions
  ADD COLUMN IF NOT EXISTS generated_review_text TEXT,
  ADD COLUMN IF NOT EXISTS review_outcome TEXT CHECK (review_outcome IN ('google_redirect', 'private'));

COMMENT ON COLUMN public.feedback_submissions.generated_review_text IS 'AI-generated review text shown to customer (for Google redirect flow)';
COMMENT ON COLUMN public.feedback_submissions.review_outcome IS 'google_redirect = happy path to Google; private = feedback only to management';
