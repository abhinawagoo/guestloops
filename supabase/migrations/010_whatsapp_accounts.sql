-- WhatsApp Cloud API: per-tenant connection via Meta Embedded Signup.
-- Each tenant connects their own WABA (WhatsApp Business Account) and phone number.

CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  waba_id TEXT NOT NULL,
  phone_number_id TEXT NOT NULL,
  display_name TEXT,
  access_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'expired', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_tenant_id ON public.whatsapp_accounts(tenant_id);

-- RLS: tenant isolation
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage whatsapp_accounts of own tenant"
  ON public.whatsapp_accounts FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

COMMENT ON TABLE public.whatsapp_accounts IS 'Per-tenant WhatsApp Business Account connection (WABA, phone_number_id, access_token) via Meta Embedded Signup';
