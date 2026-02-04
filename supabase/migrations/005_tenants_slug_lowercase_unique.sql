-- Scalable multi-tenant: enforce one slug per tenant (case-insensitive) and speed up lookups.
-- Run after 001. Normalizes existing slugs to lowercase and adds a unique index on LOWER(slug).

-- Normalize existing slugs to lowercase so LOWER(slug) lookups are consistent
UPDATE public.tenants SET slug = LOWER(slug) WHERE slug != LOWER(slug);

-- Unique index: no two tenants can have the same slug in any case (e.g. "Demo" and "demo")
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug_lower ON public.tenants (LOWER(slug));

COMMENT ON INDEX public.idx_tenants_slug_lower IS 'Case-insensitive unique slug for tenant resolution and caching';
