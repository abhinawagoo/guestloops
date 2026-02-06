-- Store guest name with feedback for personalization and WhatsApp follow-up (e.g. "Hi [name], how was your stay?").
ALTER TABLE public.feedback_submissions
  ADD COLUMN IF NOT EXISTS guest_name TEXT;

COMMENT ON COLUMN public.feedback_submissions.guest_name IS 'Guest name from QR landing; used for rewards and WhatsApp feedback requests';
