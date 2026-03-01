# GuestLoops — Product & Tech Plan (Animations, WhatsApp, AI Agents, Question Library)

This document plans the features you asked for: **animations (LottieFiles)**, **feedback completion**, **central question library**, **WhatsApp campaigns & auto-reply**, **AI reply agents with tone instructions**, and **personalized marketing**. It also states what we’ll use and how we’ll implement.

---

## 1. Animations (LottieFiles + Animated Emojis)

### What we’ll do
- Use **LottieFiles** (free JSON animations) in the **feedback flow** and **thank-you** screen.
- Prefer **free, small** animations (celebration, thumbs-up, star) so we don’t depend on you uploading files; we can switch to your assets later.
- Add **animated emojis** in feedback (e.g. emoji step with light motion on selection, celebration when moving to next step).

### What we’ll use
- **lottie-react** (or **@lottiefiles/dotlottie-react**) in the frontend to play Lottie JSON.
- Host JSON from **LottieFiles CDN** (e.g. `https://lottie.host/...`) or from `/public/lottie/` (if you add files).
- **Framer Motion** for micro-interactions (emoji tap, step transition).

### How
- **Feedback flow:** Optional Lottie on “Thank you” / “Review ready” (e.g. confetti or checkmark). Fallback: CSS/Framer-only if no Lottie URL.
- **Emoji step:** Keep current EmojiRating; add subtle scale/glow on select (Framer Motion). Optional: replace static emoji with a single Lottie “star” or “heart” that plays on tap.
- **Admin:** Later, optional “Thank you animation URL” in venue/UI settings (Lottie JSON URL or upload).

### Delivered first
- Installed **@lottiefiles/react-lottie-player**.
- Added **ThankYouLottie** at end of feedback (when `done === true`) with “You’re all set!” and celebration; fallback to 🎉 if Lottie fails.
- To use your own animation: add a Lottie JSON file at **`public/lottie/thanks.json`** or pass a LottieFiles CDN URL to the component. See `src/components/feedback/thank-you-lottie.tsx`.

---

## 2. Feedback Form Completion & Extensibility

### What we’ll do
- Ensure the form **always finishes** after the last question: either **image step → submit → outcome (Google or private) → thank-you / review screen → “done”**.
- Admin can **add/remove/reorder questions** in Settings (already partially there); we’ll keep this and extend it.
- Support **general AI-driven questions** during feedback (from a central library) and **customer-data-aware** questions (e.g. “How was the [dish they ordered]?”) in a later phase.

### What we’ll use
- Existing: **customQuestions** in `VenueSettings`, **feedback-flow** step machine (step, outcome, done).
- New: **Central question library** (DB table or JSON) tagged by type (emotion, aspect, positive, optional, post-order). Admin picks from library or writes custom; AI can suggest questions from library.

### How
- **Completion fix:** No logic change needed if flow is correct; add a clear “You’re all set!” / Lottie when `done === true` and ensure “Claim reward” / “Post to Google” always lead to `setDone(true)`.
- **Central library (later):** Table `question_library` (id, tenantId nullable, title, type, key, category, is_system). Seed system questions; venues pick from library + custom. API: `GET /api/admin/question-library`, `POST /api/admin/settings/[venueId]/questions` to assign to venue.
- **AI-generated questions during feedback:** After N steps, optional “AI suggests one more question” from library (e.g. based on venue type or last answer). Implement after library exists.

### Delivered first
- Verify and, if needed, fix the step sequence so the last question → image step → submit → outcome → thank-you is robust.
- Add a clear final state (e.g. “You’re all set!” + Lottie) when `done === true`.

---

## 3. WhatsApp: Campaigns, Auto-Reply, Dashboard

### What we’ll do
- **Post-feedback:** After submission, if customer opted in, send **one automated WhatsApp** using an approved template (already stubbed in `send-whatsapp`).
- **Campaigns from dashboard:** Manager can create **campaigns** (segment, template, schedule) and send to customers who opted in (e.g. birthday, post-visit offer, review-based segment).
- **Auto-reply to WhatsApp chats:** Bot (or AI agent) replies to incoming WhatsApp messages with templates or AI-generated replies (tone set by manager).

### What we’ll use
- **WhatsApp Cloud API** (already in scope); **approved templates** for first message; **webhook** for incoming messages.
- **Supabase:** Tables for `whatsapp_accounts`, `contacts`, `campaigns`, `campaign_sends` (see [WHATSAPP-MODULES.md](WHATSAPP-MODULES.md)).
- **Cron or Vercel Cron / Supabase Edge:** Schedule campaign sends; webhook handler for incoming WhatsApp.

### How
- **Phase 1 (✅ Done):** Per-tenant WhatsApp connection via Meta Embedded Signup (`whatsapp_accounts`). Contact management with consent tracking (`contacts`). Auto-capture from feedback forms. See [WHATSAPP-MODULES.md](WHATSAPP-MODULES.md).Keep current “send one template after feedback”- **Phase 2:** Manual send to individual contacts; template management; campaign builder (choose template, segment, schedule).
- **Phase 3:** Webhook for incoming WhatsApp → store message, call **AI reply agent** (see below) or match template → send reply.

### Delivered in plan only (implementation later)
- Schema and API shape for campaigns and segments.
- Document: “WhatsApp: use approved templates; campaigns and auto-reply in next phase.”

---

## 4. AI Reply Agents (Google Reviews + WhatsApp) with Tone Instructions

### What we’ll do
- **Google review replies:** Manager can choose **Auto / Guided / Manual**. Auto = AI generates reply; Guided = AI suggests, manager edits; Manual = manager writes.
- **WhatsApp replies:** Same idea: AI can draft replies to incoming messages; manager can set **tone** (friendly, professional, apologetic, offerable) and **instructions** (e.g. “Always mention next visit discount”).
- **Tone and instructions:** Stored per venue (or per tenant): e.g. `reply_tone`, `reply_instructions` (text). Passed into OpenAI when generating reply.

### What we’ll use
- **OpenAI** (existing) for reply generation.
- **Prompts:** Extend `reply-generator.prompt.ts` to accept `tone` and `instructions`; keep reply short and compliant.
- **DB:** In `venue_settings` or `tenants`: `reply_mode` (auto | guided | manual), `reply_tone` (friendly | professional | apologetic | offerable | luxury | casual), `reply_instructions` (optional text).

### How
- **Admin UI:** In Settings → “Review & WhatsApp replies”: dropdown for mode, dropdown for tone, textarea for custom instructions.
- **API:** When auto-replying (Google or WhatsApp), load venue’s `reply_tone` and `reply_instructions`, call OpenAI with prompt that includes them, return draft or send (depending on mode).
- **Compliance:** Only send after template approval (WhatsApp) and within platform rules (Google).

### Delivered first (minimal)
- Add `reply_tone` and `reply_instructions` to settings type and admin UI (stub).
- Extend reply-generator prompt to use tone + instructions (when we implement auto-reply).

---

## 5. Central Question Library & AI Questions During Feedback

### What we’ll do
- **Central library:** System- and tenant-level questions (emotion, aspect, yes/no, text, positive priming). Admin can add custom and pick from library for their venue.
- **Better/detailed feedback:** More structured answers (scores + text + yes/no) so AI can generate **SEO- and LLM-friendly** reviews and insights.
- **AI asks general questions:** During feedback, optionally inject 1–2 questions from library (e.g. “What mattered most today?”) or AI-suggested follow-up based on previous answer.
- **Customer-data-aware questions:** If we know the customer (e.g. from QR order or past visit), show “How was the [item they ordered]?” or “Welcome back! How was your stay this time?” (needs order/visit data and AI to pick question).

### What we’ll use
- **Supabase:** `question_library` (id, tenant_id nullable, title, type, key, category, is_system, order).
- **OpenAI:** Optional “suggest next question” from library given current answers and venue type; optional “generate one follow-up question” for richer feedback.
- **Session/DB:** Store “current order” or “last visit” for returning customers (e.g. from QR menu order or feedback_submissions) to personalize question.

### How
- **Phase 1:** Define `question_library` schema and seed 10–15 system questions. Admin Settings: “Questions” tab = list venue’s customQuestions; “Add from library” opens modal with library list; reorder/save.
- **Phase 2:** In feedback flow, after step N, optional “AI suggests one question” from library (e.g. randomly or by category) and append to current run (no DB change to venue’s default set).
- **Phase 3:** When we have order/visit data, pass “ordered_items” or “returning_guest” into feedback; prompt OpenAI to suggest a short question (e.g. “How was the Margherita pizza?”); show as one extra step.

### Delivered first
- Document only. Implementation: after feedback completion + Lottie, then question library schema + Settings UI.

---

## 6. Personalized Marketing & Customer Data

### What we’ll do
- **Data we collect:** Mobile (with consent), visit date, scores, what they liked, whether they posted a review, opt-in for WhatsApp.
- **Use for:** Segments for campaigns (e.g. “Rated 4+ and didn’t get WhatsApp yet”, “Birthday this month”, “Last visit > 30 days ago”), and **personalized offers** (birthday discount, “We miss you”, post-bad-rating apology offer).
- **Birthday offers:** Store optional `birthday` (month/day) when we ask during feedback or in a later “profile” step; campaign segment “birthday this month” → send template with offer.

### What we’ll use
- **Supabase:** `contacts` table (✅ done) with consent_status, consent_source, last_interaction. `feedback_submissions` has venue, scores, text, mobile. Add optional `birthday` to contacts for Phase 2.
- **Campaign engine:** Filter by segment → list of mobile numbers → send via WhatsApp with approved template.

### How
- **Phase 1:** Store mobile + opt-in + visit date in submissions; use for “post-feedback” single template.
- **Phase 2:** Optional “When’s your birthday?” in feedback or profile; store in guest/submission; campaign “Birthday this month” with template.
- **Phase 3:** Dashboard: “Segments” (e.g. by rating, last visit, birthday), “Campaigns” (create, schedule, send).


---

## 7. Tech Choices Summary

| Area              | Choice              | Notes                                                |
|-------------------|---------------------|------------------------------------------------------|
| Animations        | LottieFiles + React | `lottie-react` or `@lottiefiles/dotlottie-react`; CDN or `/public/lottie` |
| Feedback UX       | Framer Motion       | Already in use; step transitions, emoji tap         |
| Question library  | Supabase table      | `question_library`; system + tenant custom          |
| WhatsApp          | WhatsApp Cloud API  | Templates + webhook; campaigns via cron/job         |
| AI replies        | OpenAI              | Existing prompts; add tone + instructions          |
| Memory / context  | Supabase + prompts  | No Mem0 for now; store guest/submission in DB and pass to prompts when needed. Mem0 can be added later for long-term “remember this guest” if required. |

---

## 8. Implementation Order (Optimized)

1. **Now**
   - Add **Lottie** (e.g. `lottie-react`) and one **thank-you / celebration** animation at end of feedback.
   - **Completion:** Ensure last question → image step → submit → outcome → thank-you/review → `setDone(true)` is clear and robust; add “You’re all set!” + Lottie when `done === true`.
   - **Reply tone (stub):** Add `reply_tone` and `reply_instructions` to venue/tenant settings type and a simple UI in admin Settings (no backend reply change yet).

2. **Next**
   - **Question library:** Schema + seed data + API to list/pick questions; Settings “Questions” tab: add from library, reorder, save.
   - **Review generator:** Improve prompt so the generated Google review text is **SEO- and LLM-friendly** and consistently good (you already have `review-generator.prompt.ts`; we’ll refine and pass more structured answers).

3. **Later**
   - WhatsApp campaigns (dashboard, segments, schedule).
   - WhatsApp incoming webhook + AI auto-reply using tone/instructions.
   - AI-suggested questions during feedback and customer-data-aware questions (e.g. “How was the [ordered item]?”).

---

## 9. What You Can Provide

- **Lottie:** If you prefer to host animations yourself, add JSON files under `public/lottie/` (e.g. `thanks.json`, `celebration.json`) and we’ll point the component to them. Otherwise we use a small free LottieFiles CDN URL.
- **WhatsApp:** Template IDs and approved templates; webhook URL when you’re ready for incoming messages.
- **Tone examples:** Any exact wording you want for “friendly”, “offerable”, etc., and we’ll bake them into the reply prompt.

This plan keeps the current stack (Next.js, Supabase, OpenAI, Framer Motion), adds Lottie for animations, and sequences WhatsApp campaigns, AI agents, and question library in phases so we can ship and iterate.
