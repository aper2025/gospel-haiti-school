# Gospel Haiti International School — Management Platform

Next.js 15 · Supabase (Postgres) + Prisma · Tailwind · next-intl (FR/EN) · PWA

**Deployment target:** `portal.gospelhaiti.org` (Coolify on Hostinger VPS
`72.60.116.17`). See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full setup.

## Modules (per spec)

1. Student registration & profile (+ enrollment waitlist)
2. Student attendance (P / L_E / L_U / A_E / A_U) with offline sync
3. Academic tracking — gradebook, 4-level weekly groups, retention watch
4. Behavior system (Levels 0–6) with parent contact log
5. Fees & payments
6. Staff management (observations, leave)
7. Staff time clock (sign-in / sign-out)

Dashboards for Director, Admin, Homeroom teachers, and Subject teachers.
Weekly meeting prep reports for Wednesday (elementary KG2–4F) and Thursday
(secondary 5F–9F) staff meetings.

## Local development

```bash
npm install
cp .env.example .env        # then fill in Supabase values
npx prisma generate
npm run dev
# → http://localhost:3000
```

Type-check: `npx tsc --noEmit`
Production build: `npm run build`

## Repo layout

```
prisma/schema.prisma        # full data model, all 7 modules
src/app/                    # App Router pages + API routes
src/app/api/health/         # health check (DB ping)
src/i18n/                   # next-intl config, request handler
src/lib/prisma.ts           # Prisma singleton
src/lib/supabase.ts         # browser + server Supabase clients
src/components/             # shared UI components
messages/fr.json            # French strings (primary)
messages/en.json            # English strings (secondary)
public/manifest.webmanifest # PWA manifest
public/sw.js                # service worker (app shell cache)
DEPLOYMENT.md               # Supabase + Coolify deploy guide
```

## Data source (migration)

Legacy data lives at `~/Downloads/Gospel Haiti/school-management-system/`
(MySQL dump: `school_data_backup.sql`). Migration script at
`scripts/migrate-legacy-data.ts` (Step 18 of the build — pending).

Migrates:

- 20 staff members (with existing 4-digit PINs)
- 235 students across KG2, KG3, 1F–10F (10F imported per request, excluded
  from standard workflows via `Class.excluded = true`)
- 1 school year (`2025-26`, Sep–Jun)
- 20 time-clock entries

Does not migrate:

- Old grade categories (replaced by new evaluation types)
- Student attendance / behavior history (old tables are empty)
