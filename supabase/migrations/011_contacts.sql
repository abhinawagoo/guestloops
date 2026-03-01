-- Contact management: per-tenant customer contacts with consent tracking.
-- Used for WhatsApp messaging, campaigns, and compliance.

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'pending' CHECK (consent_status IN ('pending', 'opted_in', 'opted_out')),
  consent_source TEXT CHECK (consent_source IN ('manual', 'feedback_form', 'csv_import')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_interaction TIMESTAMPTZ,
  UNIQUE(tenant_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON public.contacts(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_contacts_consent_status ON public.contacts(tenant_id, consent_status);
CREATE INDEX IF NOT EXISTS idx_contacts_last_interaction ON public.contacts(last_interaction DESC);

-- RLS: tenant isolation
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage contacts of own tenant"
  ON public.contacts FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

COMMENT ON TABLE public.contacts IS 'Customer contacts with consent tracking for WhatsApp messaging';
