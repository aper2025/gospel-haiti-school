# GHIS Platform — Complete Project Documentation

## Project Handoff & Technical Summary

**Project:** Gospel Haiti International School — Management Platform
**URL:** https://portal.gospelhaiti.org
**Repository:** https://github.com/aper2025/gospel-haiti-school (public)
**Started:** April 16, 2026
**Status:** Live in production

---

## 1. What Was Built

A full-featured school management platform for Gospel Haiti International School (Oriani, Ouest, Haiti) serving ~235 students and 22 staff. The platform replaces a legacy MySQL/Express system with a modern Next.js application.

### Modules Implemented (9 total)

| # | Module | Description |
|---|--------|-------------|
| 1 | Student Registration & Profile | Full student records, enrollment history, sibling links, waitlist |
| 2 | Student Attendance | Daily attendance (5 codes), offline IndexedDB queue, auto-sync |
| 3 | Academic Tracking (Gradebook) | Evaluations, auto letter grades, 4-level group system, weekly placements |
| 4 | Student Behavior | 7-level system (L0-L6), incident log, parent contact log, auto admin alerts at L4+ |
| 5 | Fees & Payments | Fee schedules per class, payment recording, running balances, HTG currency |
| 6 | Staff Management | Profiles, observations, leave requests, performance status |
| 7 | Staff Time Clock | PIN-based sign-in/out, hours computed, admin manual entry |
| 8 | Report Cards & Transcripts | Trimestre-based, batch generation, cumulative averages, PDF-ready data |
| 9 | Schedules & Timetables | Time slots, timetable grid, school calendar events, conflict detection |

### Additional Features

- **Dashboard** — real-time metrics, daily summary (staff clock + per-class dropdown), charts (recharts), group distribution
- **Public attendance page** (`/take-attendance`) — PIN-based, walk class-to-class, mobile-optimized
- **Public staff clock** (`/staff-clock`) — PIN-based sign-in/out, no login required
- **Reports** — daily, weekly, monthly, trimestre, transcripts (5 tabs)
- **Settings** — school year management, user account creation, language toggle
- **Suggestion system** — database-backed feedback form on every page
- **PWA** — service worker, manifest, install prompt, offline-capable
- **Bilingual** — French (primary) and English, 130+ translation keys
- **QA test script** — automated page testing (`scripts/test-all-pages.ts`)

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5.15 |
| Language | TypeScript (strict) | 5.x |
| Database | PostgreSQL via Supabase | — |
| ORM | Prisma | 6.19.3 |
| Auth | Supabase Auth (email/password) | — |
| Styling | Tailwind CSS | 4.x |
| UI Components | Radix UI, Lucide icons | — |
| Charts | Recharts | — |
| Forms | React Hook Form + Zod | — |
| i18n | next-intl | 4.9.1 |
| Offline | IndexedDB (idb library) | — |
| State | TanStack React Query | 5.x |
| Deployment | Coolify on Hostinger VPS | — |

---

## 3. Infrastructure

### Hosting

| Service | Details |
|---------|---------|
| VPS | Hostinger KVM 1 (1 vCPU, 4GB RAM, Ubuntu) |
| VPS IP | 2.24.209.241 |
| Deployment | Coolify v4.0.0-beta.473 (http://2.24.209.241:8000) |
| Domain | portal.gospelhaiti.org (A record → 2.24.209.241) |
| SSL | Auto via Coolify + Let's Encrypt |
| DNS | Managed in Hostinger hPanel for gospelhaiti.org |

### Supabase (Database & Auth)

| Setting | Value |
|---------|-------|
| Project name | gospel-haiti-school |
| Project ref | lihxobxadeussziellii |
| Region | aws-1-us-east-1 |
| URL | https://lihxobxadeussziellii.supabase.co |
| Pooled connection (app) | Port 6543 with pgbouncer=true |
| Direct connection (migrations) | Port 5432 |

### VPS Access

| | |
|---|---|
| SSH | `ssh root@2.24.209.241` |
| Root password | `[REDACTED]` |
| Coolify dashboard | http://2.24.209.241:8000 |

---

## 4. Database Schema

**36 tables, 25 enums** defined in `prisma/schema.prisma` (959 lines)

### Core tables:
- `SchoolYear` — academic year definitions
- `Class` — 13 classes (KG2, KG3, F1-F9, F10 archived, Lycée)
- `UserProfile` — linked to Supabase Auth, stores role
- `Staff` — 22 staff records (19 active)
- `Student` — 235 student records

### Module tables:
- `Attendance`, `Evaluation`, `WeeklyGroupPlacement`, `RetentionWatch`, `TutoringAssignment`
- `BehaviorIncident`, `BehaviorLevelChange`, `ParentContact`
- `FeeSchedule`, `FeeAccount`, `Payment`
- `Observation`, `LeaveRequest`, `TimeClockEntry`, `StaffAttendance`
- `Trimestre`, `ReportCard`, `ReportCardEntry`, `Transcript`
- `TimeSlot`, `TimetableEntry`, `SchoolCalendarEvent`
- `WeeklyDataSubmission`, `Notification`, `Suggestion`

### Migrations applied:
1. `20260416170945_init_all_9_modules` — initial schema (35 tables)
2. `20260417142505_add_suggestion_table` — suggestion/feedback table
3. `20260417143752_add_lycee_class_code` — added LYCEE to ClassCode enum

---

## 5. Environment Variables (Production)

Set in Coolify → Environment Variables:

```
NIXPACKS_NODE_VERSION=22
DATABASE_URL=postgresql://postgres.lihxobxadeussziellii:[REDACTED]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.lihxobxadeussziellii:[REDACTED]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://lihxobxadeussziellii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED — see Coolify env vars or contact Director]
AUTH_SECRET=[REDACTED]
NEXT_PUBLIC_APP_URL=https://portal.gospelhaiti.org
NEXT_PUBLIC_DEFAULT_LOCALE=fr
```

---

## 6. User Accounts

### Director (full access)

| Name | Email | Password |
|------|-------|----------|
| Arun Pereira | ap@gospelhaiti.org | [REDACTED] |
| Marie-Anne Pereira | mapereira@gospelhaiti.org | [REDACTED] |

### Admin (all except Settings)

| Name | Email | Password |
|------|-------|----------|
| Roland Choizil | roland.choizil@gospelhaiti.org | [REDACTED] |
| Monise Michel | monise.michel@gospelhaiti.org | [REDACTED] |
| Don Beca Fortilus | don.beca.fortilus@gospelhaiti.org | [REDACTED] |

### Role hierarchy

| Role | Access |
|------|--------|
| DIRECTOR | Everything — settings, user management, all modules |
| ADMIN | All modules — students, attendance, gradebook, behavior, fees, staff, time clock, schedules, reports |
| HOMEROOM_TEACHER | Their class — attendance, gradebook, behavior, time clock |
| SUBJECT_TEACHER | Their assigned subjects — gradebook, time clock |
| ASSISTANT | Time clock, limited views |
| SUPPORT | Time clock only |

---

## 7. Staff PINs (for staff-clock and take-attendance)

| Name | PIN |
|------|-----|
| Rosna Alexis | 1115 |
| Don Beca Fortilus | 3408 |
| Evna Brutus | 1271 |
| Yvrose Celisten | 8312 |
| Roland Choizil | 1657 |
| Veldar Deant | 6291 |
| Kimberly Derolus | 6085 |
| Djonny Floriant | 5885 |
| Wideline Fobert | 3185 |
| Jesumene Jean | 6637 |
| Fritzner Louis Seize | 8385 |
| Adeline Louis-Jean | 9603 |
| Elinet Maurat | 7735 |
| Suzanne Maxis | 3930 |
| Monise Michel | 5416 |
| Antony Milord | 9847 |
| Silamene Paul | 4521 |
| Sony Semera | 5092 |
| Isbeline Sufferan | 4426 |

---

## 8. Staff Assignments (Homeroom + Subject Specialists)

### Homeroom teachers (teach all subjects for their class)

| Teacher | Class |
|---------|-------|
| Monise Michel | KG2 |
| Isbeline Sufferan | KG3 |
| Kimberly Derolus | 1F |
| Antony Milord | 2F |
| Wideline Fobert | 3F |
| Fritzner Louis Seize | 4F |
| Djonny Floriant | 5F |
| Elinet Maurat | 6F |
| Evna Brutus | 7F |
| Sony Semera | 8F |
| Jesumene Jean | 9F |

### Subject specialists (5F-9F)

| Teacher | Subject | Classes |
|---------|---------|---------|
| Jesumene Jean | Mathématiques | 7F, 8F, 9F |
| Evna Brutus | Lecture | 7F, 8F, 9F |
| Sony Semera | Sciences Sociales | 7F, 8F, 9F |
| Sony Semera | Créole | 7F |
| Sony Semera | Musique | 7F |
| Enel Vilson* | Sciences | 7F, 8F, 9F |
| Enel Vilson* | Biologie | 8F |
| Enel Vilson* | Créole | 8F |
| Don Beca Fortilus | Espagnol | 7F, 8F, 9F, Lycée |
| Don Beca Fortilus | Anglais | 7F, 8F, 9F, Lycée |

*Enel Vilson is deactivated in the system — assignments remain for reference.

---

## 9. School Structure

| Class | Label | Tier | Students | Teacher model |
|-------|-------|------|----------|--------------|
| KG2 | KG2 | Kindergarten | 25 | Single homeroom |
| KG3 | KG3 | Kindergarten | 24 | Single homeroom |
| F1 | 1F | Elementary | 29 | Single homeroom |
| F2 | 2F | Elementary | 30 | Single homeroom |
| F3 | 3F | Elementary | 26 | Single homeroom |
| F4 | 4F | Elementary | 21 | Single homeroom |
| F5 | 5F | Secondary | 17 | Homeroom + specialists |
| F6 | 6F | Secondary | 17 | Homeroom + specialists |
| F7 | 7F | Secondary | 11 | Homeroom + specialists |
| F8 | 8F | Secondary | 16 | Homeroom + specialists |
| F9 | 9F | Secondary | 12 | Homeroom + specialists |
| Lycée | Lycée | Lycée | 7 | Specialists |
| F10 | 10F | Lycée | 0 | Archived (excluded) |

**Total active students:** 235
**Academic year:** 2025-26 (Sep 2025 – Jun 2026)
**Trimestres:** T1 (Sep 1 – Dec 19), T2 (Jan 5 – Mar 27), T3 (Apr 6 – Jun 30)

---

## 10. Data Migration

Data was migrated from the legacy system at `~/Downloads/Gospel Haiti/school-management-system/school_data_backup.sql` (MySQL dump, Oct 20, 2025).

### What was migrated:
- **20 staff** — names, emails, roles, PINs
- **235 students** — names, DOB, gender, class, contacts, residence, behavior levels, notes
- **20 time clock entries** — from Oct 19-20, 2025
- **Staff assignments** — 35 assignments created from spec (homeroom + subject specialists)
- **Fee schedules** — 12 schedules (one per class, placeholder amounts)
- **Fee accounts** — 235 accounts (one per student)
- **Trimestres** — T1, T2, T3 for 2025-26
- **School year** — 2025-26 (active)

### What was NOT migrated (empty in legacy):
- Student attendance (no data in old system)
- Grades/evaluations (no data)
- Behavior incidents (no data)
- Grade categories (replaced by new evaluation types)

### Migration scripts:
- `scripts/migrate-legacy.ts` — first pass: staff + students
- `scripts/migrate-remaining.ts` — second pass: updated student fields + time clock entries

---

## 11. File Structure

```
gospel-haiti-school/
├── prisma/
│   ├── schema.prisma              # 959 lines, 36 tables, 25 enums
│   └── migrations/                # 3 migrations
├── scripts/
│   ├── migrate-legacy.ts          # Legacy MySQL → Prisma migration
│   ├── migrate-remaining.ts       # Second-pass migration
│   └── test-all-pages.ts          # Automated QA agent
├── docs/
│   ├── guide-administrateur-ghis.md  # French admin guide
│   └── PROJECT-HANDOFF.md         # This document
├── messages/
│   ├── fr.json                    # French translations (130+ keys)
│   └── en.json                    # English translations
├── public/
│   ├── manifest.webmanifest       # PWA manifest
│   └── sw.js                      # Service worker
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── sign-in/               # Auth sign-in
│   │   ├── auth/callback/         # PKCE callback
│   │   ├── staff-clock/           # Public PIN-based staff sign-in/out
│   │   ├── take-attendance/       # Public PIN-based attendance
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard with charts
│   │   │   ├── daily-summary.tsx  # Staff clock + class summary
│   │   │   ├── dashboard-charts.tsx # Recharts wrapper
│   │   │   ├── charts-inner.tsx   # Actual chart components
│   │   │   ├── sidebar.tsx        # Navigation sidebar
│   │   │   ├── layout.tsx         # Protected layout
│   │   │   ├── students/          # Module 1
│   │   │   ├── attendance/        # Module 2
│   │   │   ├── gradebook/         # Module 3
│   │   │   ├── behavior/          # Module 4
│   │   │   ├── fees/              # Module 5
│   │   │   ├── staff/             # Module 6
│   │   │   ├── time-clock/        # Module 7
│   │   │   ├── reports/           # Module 8 (report cards + all reports)
│   │   │   ├── schedules/         # Module 9
│   │   │   ├── settings/          # Admin settings
│   │   │   └── weekly-report/     # Redirects to reports?tab=weekly
│   │   └── api/
│   │       ├── health/            # DB health check
│   │       ├── attendance/sync/   # Offline sync endpoint
│   │       └── suggestions/       # Suggestion CRUD
│   ├── lib/
│   │   ├── prisma.ts              # Prisma singleton
│   │   ├── auth.ts                # getCurrentUser, requireAuth, requireRole
│   │   ├── cn.ts                  # Tailwind class merge
│   │   ├── supabase/              # Browser, server, middleware, admin clients
│   │   ├── schemas/               # Zod validation schemas
│   │   └── offline/               # IndexedDB queue for attendance
│   ├── components/
│   │   ├── ServiceWorkerRegistrar.tsx
│   │   ├── PwaInstallPrompt.tsx
│   │   └── SuggestionForm.tsx
│   ├── middleware.ts              # Auth session refresh + route protection
│   └── i18n/                      # Locale config + request resolver
├── .env                           # Local env (not committed)
├── .env.example                   # Env template
├── next.config.ts                 # Next.js + next-intl config
├── package.json                   # Dependencies
└── tsconfig.json                  # TypeScript config
```

---

## 12. Key Design Decisions

1. **Auth: Email/password only** — Google OAuth deferred because only teaching staff have Google Workspace accounts. Supabase Auth handles credentials; `UserProfile` table stores app-specific role. Google OAuth can be added later as a Supabase provider toggle.

2. **Offline support** — Attendance entries save to IndexedDB when offline and auto-sync when connection returns. `clientUuid` field enables idempotent sync.

3. **Lower vs upper grade gradebook** — KG2-4F have a single homeroom teacher teaching all subjects, so the gradebook shows all subjects at once. 5F-9F require subject selection because of subject specialists.

4. **Public pages without login** — `/staff-clock` and `/take-attendance` use 4-digit PINs instead of full auth, designed for shared devices and quick mobile use.

5. **10F handling** — Imported as `F10` with `excluded=true`. Students moved to new `Lycée` class (not excluded).

6. **French-first UI** — All labels default to French via next-intl. English toggle available in Settings.

---

## 13. How to Deploy Changes

### From local development:
```bash
# Make changes
git add -A && git commit -m "description"
git push origin main
```

### In Coolify:
- Go to http://2.24.209.241:8000
- Navigate to the app
- Click **Redeploy** (or enable auto-deploy from GitHub webhooks)

### Database migrations:
```bash
npx prisma migrate dev --name description   # local
# Coolify runs prisma generate during build automatically
# For schema changes, push migration files to git — they run on deploy
```

---

## 14. How to Rebuild From Scratch

1. Clone the repo: `git clone https://github.com/aper2025/gospel-haiti-school`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase credentials
4. Run migrations: `npx prisma migrate deploy`
5. Seed data: `npx tsx scripts/migrate-legacy.ts && npx tsx scripts/migrate-remaining.ts`
6. Run dev: `npm run dev`
7. Build: `npm run build`

### To set up a new Supabase project:
1. Create project at supabase.com
2. Get DATABASE_URL, DIRECT_URL from Settings → Database → Connection string
3. Get SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY from Settings → API
4. Run `npx prisma migrate deploy` to create all tables
5. Create the first Director user account via the script in `scripts/`

---

## 15. Costs

| Service | Monthly Cost |
|---------|-------------|
| Hostinger VPS KVM 1 | $6.49/mo |
| Supabase (free tier) | $0 |
| Domain (gospelhaiti.org) | Already owned |
| **Total** | **~$6.49/mo** |

---

## 16. Contact & Ownership

| | |
|---|---|
| School | Gospel Haiti International School, Oriani, Ouest, Haiti |
| Director | Pastor Arun Pereira (ap@gospelhaiti.org) |
| Domain | gospelhaiti.org (managed in Hostinger) |
| GitHub | github.com/aper2025/gospel-haiti-school |
| Platform built | April 16-17, 2026 |
| Built with | Claude Code (Anthropic) |

---

*Document last updated: April 17, 2026*
