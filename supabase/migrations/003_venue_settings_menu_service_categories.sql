-- Add menu_categories and service_categories to venue_settings for full menu/services (categories + items with images, price, description, enable/disable).
-- When using Supabase for settings, persist these JSONB columns; app falls back to menu_items/service_items if null.

ALTER TABLE public.venue_settings
  ADD COLUMN IF NOT EXISTS menu_categories JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS service_categories JSONB DEFAULT '[]';

COMMENT ON COLUMN public.venue_settings.menu_categories IS 'Categories (e.g. Dessert) with items (Baklava, Ice cream); each item can have imageUrl, price, description, enabled, sizes';
COMMENT ON COLUMN public.venue_settings.service_categories IS 'Service categories (e.g. Spa) with items; each item can have imageUrl, price, description, enabled';
