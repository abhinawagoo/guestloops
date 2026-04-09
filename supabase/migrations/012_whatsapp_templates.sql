-- WhatsApp message templates — local cache + creation tracking per tenant WABA.
-- Templates are created via Meta Cloud API and stored here for quick access.
-- Status reflects Meta's approval state (PENDING → APPROVED or REJECTED).

CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  meta_template_id TEXT,                          -- Meta's template ID returned after creation
  name TEXT NOT NULL,                             -- e.g. "review_request" (lowercase, underscores)
  category TEXT NOT NULL DEFAULT 'MARKETING'
    CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
  language TEXT NOT NULL DEFAULT 'en_US',
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL', 'PENDING_DELETION')),
  components JSONB NOT NULL DEFAULT '[]',         -- header, body, footer, buttons components
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_tenant_id ON public.whatsapp_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON public.whatsapp_templates(status);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage whatsapp_templates of own tenant"
  ON public.whatsapp_templates FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

COMMENT ON TABLE public.whatsapp_templates IS
  'Per-tenant WhatsApp message templates. Created via Meta Cloud API, cached here with approval status.';
