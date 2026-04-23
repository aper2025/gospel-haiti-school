# Handoff: Haiti Timezone + Supabase RLS Security Fix

**Session dates:** 2026-04-20 to 2026-04-23
**Commits:** `c74e4e5`, `feb869b` on `main`
**Deployed:** Yes, via Coolify API. Both commits are live at https://portal.gospelhaiti.org

---

## 1. What we were doing and why

**Timezone:** All dates and times in the app were using UTC or server-local time. The school is in Oriani, Haiti (timezone `America/Port-au-Prince`, Eastern Time). Staff sign-in/out times, attendance dates, dashboard "today" calculations, and all date displays needed to reflect Haiti local time. Without this fix, a staff member signing in at 7:30am Haiti time could see the wrong date or time if the server runs in a different timezone.

**RLS:** Supabase emailed a critical security warning — all 36 tables in the `public` schema had Row-Level Security disabled. Since the Supabase anon key is public by design (embedded in the frontend), anyone with the project URL could read/write every table via Supabase's PostgREST REST API, even though the app itself only uses Prisma (direct PostgreSQL) for data access.

---

## 2. Current state

### Done
- **Timezone utility** (`src/lib/timezone.ts`): shared constants and helpers — `HAITI_TZ`, `haitiToday()`, `haitiDateOnly()`, `formatTimeFR()`, `formatDateFR()`, `haitiWeekStart()`.
- **21 files updated** to use the timezone utility for all "today" calculations, time displays, date formatting, and week-start computations. TypeScript compiles clean.
- **RLS enabled** on all 36 tables via Prisma migration `20260422173556_enable_rls_all_tables`. No RLS policies were added — this means the PostgREST API is fully locked (no access via anon/authenticated roles), while Prisma continues to work because it connects as the database owner (bypasses RLS).
- **Coolify deploy script** (`scripts/deploy.sh`): reads credentials from `.env.local` (gitignored), calls the Coolify v4 API to trigger a restart. The API token has `deploy`-only permission.
- **Coolify credentials** stored in `.env.local` (not committed):
  - `COOLIFY_URL=http://2.24.209.241:8000`
  - `COOLIFY_APP_UUID=le39pjm4ea3smuoq1fqnp4dz`
  - `COOLIFY_API_TOKEN=<deploy-scoped token>`

### Not broken (verified)
- TypeScript compiles with zero errors after all changes.
- Prisma migration applied successfully to the live Supabase database.
- Deploy triggered and completed on Coolify.

### Not yet verified
- No manual QA was done on the live site to confirm times display correctly in Haiti TZ. The user should check staff clock, dashboard, and attendance pages.
- Supabase security dashboard hasn't been rechecked to confirm the RLS warning cleared.

---

## 3. Key decisions

| Decision | Why |
|---|---|
| Single timezone utility file (`src/lib/timezone.ts`) | Centralizes the `America/Port-au-Prince` constant so it's never hardcoded across 21 files. |
| `toLocaleDateString("en-CA", { timeZone })` for YYYY-MM-DD | The `en-CA` locale reliably produces ISO date format without needing manual string manipulation. Replaces all `toISOString().split("T")[0]` patterns which computed UTC dates. |
| Date-only DB fields use `timeZone: "UTC"` | Fields like `dateOfBirth`, `startDate` are stored as midnight UTC. Displaying them in Haiti TZ (UTC-5) would shift them to the previous day. UTC keeps the calendar date correct. |
| Timestamp fields use `timeZone: HAITI_TZ` | Fields like `signInAt`, `signOutAt`, `changedAt` are real timestamps that should display in local time. |
| RLS with no policies (deny-all) | The app never uses Supabase client-side queries — all data access is through Prisma on the server. Enabling RLS with no policies blocks PostgREST entirely, which is the desired behavior. If Supabase Realtime or client-side queries are ever needed, policies would need to be added. |
| Coolify API token scoped to `deploy` only | Minimal permission — can only trigger deploys, cannot read app config or secrets. |

---

## 4. Files modified

### New files
- `src/lib/timezone.ts` — timezone utility (HAITI_TZ constant + 5 helper functions)
- `scripts/deploy.sh` — Coolify redeploy trigger script
- `prisma/migrations/20260422173556_enable_rls_all_tables/migration.sql` — RLS migration
- `.env.local` — Coolify credentials (gitignored, not committed)

### Modified files (timezone updates)
- `src/app/dashboard/page.tsx` — today calc, week calc, time formatting
- `src/app/dashboard/time-clock/page.tsx` — today calc, all time displays
- `src/app/dashboard/time-clock/actions.ts` — today calc (sign-in/out)
- `src/app/dashboard/time-clock/admin-entry-form.tsx` — default date input
- `src/app/dashboard/reports/page.tsx` — today calc, week calc, month calc, time/date displays
- `src/app/dashboard/attendance/page.tsx` — today calc
- `src/app/dashboard/gradebook/page.tsx` — week calc
- `src/app/dashboard/gradebook/gradebook-view.tsx` — default date input
- `src/app/dashboard/behavior/page.tsx` — date display (UTC for date-only)
- `src/app/dashboard/behavior/new-incident-dialog.tsx` — default date input
- `src/app/dashboard/students/[id]/page.tsx` — date display
- `src/app/dashboard/staff/page.tsx` — date displays (UTC for date-only)
- `src/app/dashboard/staff/[id]/page.tsx` — date displays (UTC for date-only)
- `src/app/dashboard/staff/[id]/observation-form.tsx` — default date input
- `src/app/dashboard/settings/page.tsx` — date display (UTC for date-only)
- `src/app/dashboard/schedules/page.tsx` — date display (UTC for date-only)
- `src/app/dashboard/fees/payment-dialog.tsx` — default date input
- `src/app/staff-clock/page.tsx` — today calc, date display
- `src/app/staff-clock/actions.ts` — today calc
- `src/app/take-attendance/page.tsx` — today calc, date display

---

## 5. Next steps

1. **Manual QA on live site** — Open https://portal.gospelhaiti.org and verify: (a) dashboard date header shows correct Haiti date, (b) staff clock page shows correct Haiti time for sign-in/out, (c) attendance page defaults to correct Haiti date. Have a staff member sign in via `/staff-clock` and confirm the timestamp is correct.

2. **Recheck Supabase security dashboard** — Go to Supabase dashboard → project `lihxobxadeussziellii` → Security Advisor. Confirm the "Table publicly accessible" warning is resolved. If any tables still show, investigate whether Prisma created additional tables not covered by the migration.

3. **Set up Coolify auto-deploy via GitHub webhook** — Currently deploys are triggered manually via `scripts/deploy.sh` or the Coolify UI. Setting up a webhook on the GitHub repo to auto-trigger Coolify on push to `main` would streamline the workflow. In Coolify, go to the app → Webhooks tab to get the webhook URL, then add it in GitHub repo Settings → Webhooks.
