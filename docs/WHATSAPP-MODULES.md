# WhatsApp Engagement Module — Implementation Status

GuestLoops is evolving into an **AI Guest Engagement Platform** for hotels and restaurants. This document tracks the WhatsApp integration modules and their implementation status.

---

## Module Overview

| Module | Status | Description |
|--------|--------|-------------|
| **1. WhatsApp Connection** | ✅ Done | Per-tenant Meta Embedded Signup; store WABA, phone_number_id, access_token |
| **2. Contact Management** | ✅ Done | Contacts with consent tracking; add, import CSV, auto-capture from feedback |
| **3. Manual Message Sending** | 🔲 Pending | Send template messages to individual contacts |
| **4. Template Management** | 🔲 Pending | View/create templates; track approval status |
| **5. Campaign Builder** | 🔲 Pending | Send to multiple contacts; schedule; track performance |
| **6. AI Smart Automation** | 🔲 Pending | Auto review request (rating ≥4), apology flow (≤3), AI campaign generator |
| **7. Analytics Dashboard** | 🔲 Pending | Messages sent, delivery rate, read rate, campaign performance |
| **8. Compliance & Safety** | 🔲 Pending | Opt-out webhook, consent validation, token encryption, rate limiting |

---

## Module 1 — WhatsApp Connection ✅

**Goal:** Each tenant connects their own WhatsApp number via Meta Embedded Signup.

### Database
- **Table:** `whatsapp_accounts` (migration `010_whatsapp_accounts.sql`)
- Columns: `id`, `tenant_id`, `waba_id`, `phone_number_id`, `display_name`, `access_token`, `status`, `created_at`, `updated_at`

### API
- `GET /api/admin/whatsapp/status` — Connection status
- `POST /api/admin/whatsapp/connect` — Connect (code exchange or direct payload)
- `POST /api/admin/whatsapp/disconnect` — Disconnect

### UI
- **Settings → WhatsApp** — Connect button, Embedded Signup flow, status display

### Env vars
- `NEXT_PUBLIC_META_APP_ID`, `NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID`
- `META_APP_SECRET`, `META_WHATSAPP_REDIRECT_URI`

---

## Module 2 — Contact Management ✅

**Goal:** Store customer contacts with consent tracking; no cross-tenant data leakage.

### Database
- **Table:** `contacts` (migration `011_contacts.sql`)
- Columns: `id`, `tenant_id`, `name`, `phone`, `consent_status`, `consent_source`, `created_at`, `last_interaction`
- `consent_status`: `pending` | `opted_in` | `opted_out`
- `consent_source`: `manual` | `feedback_form` | `csv_import`

### API
- `GET /api/admin/contacts` — List (search, filter by consent, pagination)
- `POST /api/admin/contacts` — Add manually
- `PATCH /api/admin/contacts/[id]` — Update
- `DELETE /api/admin/contacts/[id]` — Delete
- `POST /api/admin/contacts/opt-out` — Opt out by phone
- `POST /api/admin/contacts/import` — Import CSV (file or JSON `{ csv }`)

### Features
- Add contact manually
- Import CSV (name, phone)
- Auto-capture from feedback forms (with consent status)
- Opt-out support

### UI
- **Admin → Contacts** — List, search, filter, add, import, opt-out, delete

---

## Development Order (Recommended)

1. WhatsApp connection ✅  
2. Contact system ✅  
3. Manual send  
4. Template system  
5. Campaign builder  
6. AI automation  
7. Analytics  
8. Compliance  

---

## Migrations Reference

| Migration | Tables / Changes |
|-----------|------------------|
| `001_tenants_profiles_venues.sql` | tenants, profiles, venues, venue_settings, feedback_submissions |
| `002_feedback_review_outcome.sql` | generated_review_text, review_outcome on feedback_submissions |
| `003_venue_settings_menu_service_categories.sql` | menu_categories, service_categories (JSONB) |
| `004_venue_settings_google_review_default_rating.sql` | google_review_url, default_rating_style, reply_tone, reply_instructions |
| `005_tenants_slug_lowercase_unique.sql` | Unique index on LOWER(slug) |
| `006_feedback_submissions_guest_name.sql` | guest_name column |
| `007_google_business_profile.sql` | google_oauth_tokens, venue_gbp_locations, google_reviews |
| `008_growth_intelligence.sql` | local_growth_scores, AI analysis columns |
| `009_phonepe_payments.sql` | phonepe_payments |
| `010_whatsapp_accounts.sql` | whatsapp_accounts (per-tenant WhatsApp connection) |
| `011_contacts.sql` | contacts (consent tracking) |
