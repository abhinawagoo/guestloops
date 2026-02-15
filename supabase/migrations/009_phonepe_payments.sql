-- PhonePe webhook: persist payment events for idempotency and history (per tenant).
-- Webhook sends checkout.order.completed, checkout.order.failed, pg.refund.*.
-- Run after 001-008.

CREATE TABLE IF NOT EXISTS public.phonepe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  merchant_order_id TEXT NOT NULL,
  phonepe_order_id TEXT,
  amount_paisa BIGINT,
  state TEXT NOT NULL,
  event TEXT NOT NULL,
  meta_info JSONB DEFAULT '{}',
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_order_id)
);

CREATE INDEX IF NOT EXISTS idx_phonepe_payments_tenant_id ON public.phonepe_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_phonepe_payments_state ON public.phonepe_payments(state);
CREATE INDEX IF NOT EXISTS idx_phonepe_payments_created_at ON public.phonepe_payments(created_at DESC);

COMMENT ON TABLE public.phonepe_payments IS 'PhonePe webhook events; idempotent by merchant_order_id. udf2=tenant_id, udf4=tenant_slug in meta_info.';
