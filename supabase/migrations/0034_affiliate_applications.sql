-- Keep creator partnership applications durable even if email delivery fails.

CREATE TABLE IF NOT EXISTS public.affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('YouTube', 'Substack', 'Blog', 'Podcast', 'Other')),
  url TEXT NOT NULL,
  audience_size TEXT NOT NULL,
  about TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  admin_note TEXT
);

CREATE INDEX IF NOT EXISTS affiliate_applications_status_idx
  ON public.affiliate_applications(status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS affiliate_applications_pending_email_idx
  ON public.affiliate_applications(lower(email))
  WHERE status = 'pending';

ALTER TABLE public.affiliate_applications ENABLE ROW LEVEL SECURITY;

-- No client policies: public submissions go through the validated API and
-- administration uses the service role.
REVOKE ALL ON TABLE public.affiliate_applications FROM anon, authenticated;
GRANT ALL ON TABLE public.affiliate_applications TO service_role;
