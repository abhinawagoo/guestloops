# Branch & environment workflow

Use **develop** for all new work and a **Testing** Supabase project. Only after testing, merge to **main** and use **Production** Supabase. Never run migrations or paste secrets directly against production until you’re ready.

---

## Branches

| Branch    | Use for              | Deploys to / runs with        |
|----------|------------------------|-------------------------------|
| **develop** | Day-to-day development | Local (`npm run dev`) or Vercel Preview → **Testing** Supabase |
| **main**    | Production-ready code   | Vercel Production → **Production** Supabase |

---

## Supabase projects (keep them separate)

| Project       | Use with branch | Purpose                          |
|---------------|------------------|----------------------------------|
| **Production** | `main` only      | Live app; real users and data   |
| **Testing**    | `develop`        | Try migrations, features, config |
| **Local** (optional) | `develop` locally | `npm run dev` on your machine |

Create **Testing** and **Production** as separate projects in [Supabase Dashboard](https://supabase.com/dashboard). Run migrations in **Testing** first; only run the same migrations in **Production** after you’ve merged to `main`.

---

## Daily workflow

### 1. Work on the testing branch

```bash
git checkout develop
git pull origin develop   # if working with a team
# do your changes...
```

### 2. Use Testing Supabase (not Production)

- **Local:** Use `.env.local` with your **Testing** (or Local) Supabase URL, anon key, and service role key.  
  Never put the **Production** service role key in `.env.local` while developing.
- **Vercel Preview:** In Vercel → Settings → Environment Variables, set **Preview** env vars to your **Testing** Supabase project. Then preview deployments from `develop` use the test DB.

### 3. Run migrations on Testing first

- Apply new migration files (e.g. `008_growth_intelligence.sql`) in the **Testing** project:  
  Supabase Dashboard → **Testing** project → SQL Editor → paste migration → Run.
- Test the app (local or Vercel Preview) against Testing. Confirm everything works.

### 4. Promote to production only after testing

- When you’re satisfied on `develop`:
  - Merge into `main` (e.g. PR or `git checkout main && git merge develop`).
  - Run the **same** migrations in the **Production** Supabase project (SQL Editor).
  - Deploy `main` (Vercel usually auto-deploys on push to `main`).
- Production env vars in Vercel should point to the **Production** Supabase project only.

---

## Checklist: “Don’t touch production until…”

- [ ] Code is on `develop` and tested locally or on Vercel Preview.
- [ ] Migrations were run and verified on **Testing** Supabase.
- [ ] No Production keys or Production DB used in development.
- [ ] Merged to `main`, then run the same migrations on **Production** Supabase and deploy.

---

## Quick reference

| I want to…              | Do this |
|--------------------------|--------|
| Start a new feature     | `git checkout develop`, use Testing Supabase in `.env.local` |
| Try a new migration     | Run it in **Testing** Supabase SQL Editor, test app, then run same SQL in **Production** only after merge to `main` |
| Ship to production      | Merge `develop` → `main`, run migrations on Production Supabase, deploy `main` |
| Keep prod safe          | Never paste Production service role key or run untested SQL on Production |
