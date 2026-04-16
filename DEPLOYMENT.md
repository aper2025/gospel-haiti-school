# Deployment guide — portal.gospelhaiti.org

This is the operational setup for the Gospel Haiti International School
management platform. Follow it once, end-to-end, the first time you deploy.

DNS is already configured: `portal.gospelhaiti.org` → `72.60.116.17`.

---

## 1. Provision Supabase

1. Go to <https://supabase.com> → sign in → **New project**.
2. Name: `gospel-haiti-school` (keep separate from `gospel-academy-platform`).
3. Region: closest to Haiti — **US East (N. Virginia)** recommended.
4. Strong database password → save it to a password manager.
5. Wait for the project to finish provisioning (~2 min).

### Copy connection strings

From **Project Settings → Database → Connection string**:

- **Transaction pooler** (port 6543) → this is `DATABASE_URL`.
  Add `?pgbouncer=true&connection_limit=1` to the end.
- **Session pooler** or **Direct connection** (port 5432) → this is `DIRECT_URL`.
  Used only by Prisma Migrate.

From **Project Settings → API**:

- **URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-only!)

Fill `.env` locally and re-run the app.

---

## 2. First migration

```bash
# Generate the initial migration from the Prisma schema.
npx prisma migrate dev --name init

# Regenerate the typed client.
npx prisma generate
```

`migrate dev` uses `DIRECT_URL`. After it succeeds you will have:

- A `prisma/migrations/<timestamp>_init/` folder — commit this.
- All 30+ tables created in Supabase Postgres.

Verify in Supabase Studio → **Table Editor**: you should see `Student`,
`Attendance`, `Evaluation`, `FeeAccount`, etc.

---

## 3. Data migration from the old system

Source: `~/Downloads/Gospel Haiti/school-management-system/school_data_backup.sql`

A seed script lives at `scripts/migrate-legacy-data.ts` (Step 18 in the build
order — not written yet). It will:

1. Parse the MySQL dump.
2. Create a `SchoolYear` row for `2025-26`.
3. Create the 12 `Class` rows (KG2, KG3, 1F–9F, 10F with `excluded=true`).
4. Insert 20 `Staff` rows (preserving legacy UUIDs, existing PINs, emails).
5. Insert all 235 `Student` rows, mapping `Maternelle 2/3` → `KG2/KG3` and
   `1ère`–`10ème` → `F1`–`F10`. Class assignments go to `currentClass` and a
   matching `StudentEnrollment` row for `2025-26`.
6. Import the 20 `TimeClockEntry` rows from `staff_attendance`.
7. Skip `grade_categories` (replaced by new evaluation system).

Run with: `npx tsx scripts/migrate-legacy-data.ts`

---

## 4. Coolify deployment

Coolify is already running on the Hostinger VPS (`72.60.116.17`). Use the
existing `gospel-academy-platform` service as a template.

### Steps

1. **Push this repo to GitHub.** Private repo is fine.
2. In Coolify → **New Resource → Application → Public/Private Repository**.
3. Select the repo, branch `main`. Build pack: **Nixpacks** (auto-detects Next.js).
4. **Environment variables** — add every row from your `.env` (copy from
   `.env.example` and fill in real Supabase values).
5. **Domain**: set to `portal.gospelhaiti.org`. Coolify provisions a
   Let's Encrypt certificate automatically.
6. **Port**: `3000` (Next.js default).
7. **Build command**: `npm ci && npx prisma generate && npm run build`
8. **Start command**: `npm start`
9. **Pre-deploy hook** (run migrations on every release):
   `npx prisma migrate deploy`
10. Deploy.

### Verify

- `https://portal.gospelhaiti.org/` — shows landing page in French.
- `https://portal.gospelhaiti.org/api/health` → `{"status":"ok","db":"ok"}`.

---

## 5. Seed the Director account

After the first deploy, create Pastor Arun's login. Either:

- Use the admin console (Step 6 of build order — not built yet), or
- Temporarily run `npx tsx scripts/seed-director.ts` (also pending).

---

## 6. Useful references

- Old production repo: `~/Downloads/Gospel Haiti/school-management-system/`
- Reference Coolify app: `gospel-academy-platform` (same VPS)
- Supabase docs: <https://supabase.com/docs/guides/database/prisma>
- Prisma + Supabase pooling:
  <https://www.prisma.io/docs/orm/overview/databases/supabase>

---

## Backup strategy (set up before going live)

1. **Supabase daily backups** — enable in Project Settings → Database
   (free tier: 7 days; Pro: up to 30 days with PITR).
2. **Manual monthly dump** saved to the church's Google Drive:
   `pg_dump --clean --if-exists "$DIRECT_URL" > school-backup-$(date +%F).sql`
3. **Storage bucket backups** — if student photos are stored in Supabase
   Storage, replicate the bucket to a second provider quarterly.

The internet at the school is unreliable — offline writes are queued to
IndexedDB on each device and drained when the connection returns, so no
attendance or grade data is lost during an outage.
