# PROJECT_STATUS.md — Rajasthan Exam Twister
## Master Handoff Document — Read This Completely Before Touching Any Code

**Last updated:** This file is the single source of truth for what has
been built, what is verified, what is broken/unconfirmed, and what is
still pending. If you are a coding agent picking up this project, read
this file FIRST, then cross-check the claims below against the actual
repository state (file existence, git log, test results) before doing
anything — do not trust status claims blindly, verify them.

This file supersedes any conflicting status claims in individual batch
walkthroughs — those were point-in-time reports; this is the current
consolidated truth as of the last update.

---

## 1. PROJECT SUMMARY

A Rajasthan government-exam preparation website: single-admin CMS for
Blogs and Notes (with legacy HTML import), plus a Quiz Engine where
question papers are converted to JSON via an external AI prompt and
uploaded. Public site includes Student Google-login (session/history
features), search, categories, and social integrations.

Repository: `github.com/chiragbhoi01/trynew` — branch `main`.

---

## 2. FINAL ARCHITECTURE (do not re-litigate these)

| Layer | Decision |
|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| Backend | Modular monolith — Next.js Route Handlers, no separate server |
| Database | **MongoDB + Mongoose** (switched from an earlier Postgres/Prisma draft — do not revert) |
| Admin auth | Custom JWT in httpOnly cookie (`auth_token`), bcrypt password hashing — independent of student auth |
| Student auth | NextAuth (Auth.js) with Google OAuth, separate cookie/session namespace from admin — never grants admin access, and admin session never grants student access |
| Editor | Tiptap, HTML-backed, sanitized via `sanitize-html` |
| Media storage | **Cloudinary** in production (`CloudinaryStorageProvider`), `LocalDiskStorageProvider` for local dev only — switched via `MEDIA_PROVIDER` env var. Local storage was a Batch 3 placeholder and is UNSAFE on Vercel (ephemeral filesystem) — Cloudinary is mandatory for any real deploy. |
| Search | MongoDB native `$text` full-text search — no Elasticsearch |
| Deployment target | Vercel (app) + MongoDB Atlas (DB) + Cloudinary (media) |
| Social/community | Telegram, Instagram, X, YouTube — real URLs wired (see §6) |

---

## 3. WHAT IS BUILT AND VERIFIED (code-complete, tests passing at time of report)

Batches below were each verified with `npx vitest run` / `npm run
typecheck` / `npm run build` and committed+pushed to `main`. Re-run all
three before trusting these numbers are still accurate — new work since
may have changed counts.

| Batch | Feature | Last known verified state |
|---|---|---|
| 1 | Foundation: scaffold, Mongoose Admin model, JWT auth, protected `/admin` shell | 6/6 tests |
| 2 | Blog CMS (CRUD, publish/unpublish, slug, Tiptap, public pages) | 18/18 tests |
| 3 | Notes CMS (image-based notes, Category/Tag, minimal Media) | 39/39 tests |
| 4 | HTML Import pipeline (sanitize, dedupe, dry-run, bulk, rollback) | 46/46 tests |
| 5 | Media Library (full CRUD, reference-counted delete guard, picker) | 52/52 tests |
| 6 | Search + public Category/Tag browsing | 63/63 tests |
| 7 | SEO/Performance/Security hardening (sitemap, robots, JSON-LD, CSRF, rate-limit, CSP, ISR) | 71/71 tests |
| 8 | Full regression pass + `DEFINITION_OF_DONE.md` | 72/72 tests — **see §5 caveats, this was NOT a fully clean sign-off** |
| — | CSRF gap-fill patch (header enforced on all mutations) | 71/71 tests |
| 9 | Quiz Engine (models, AI-JSON import, scoring, admin+public UI, `/quiz-tools/create` prompt page) | tests present (`quiz-validation.test.ts`, `quiz-service.test.ts`) — discovered mid-project, not originally sequenced, exists and is reported safe to leave live |
| 10/11 | Branding (logo/banner, extracted color palette), Navigation redesign, Homepage Quick Access grid, Categories index, SEO JSON-LD extensions, RSS feed, social share, print button | 85/85 tests, 28/28 routes |
| 11-patch | Real social links wired (Telegram/Instagram/X/YouTube) in header/footer/schema + CTA banner | 85/85 tests |
| — | **Deployment blocker fix**: removed duplicate `app/page.tsx` vs `app/(public)/page.tsx` route conflict causing Vercel ENOENT build failure | clean local build, 28/28 routes |
| — | Bulk Select + Bulk Publish for Notes admin (partial-success reporting) | 91/91 tests, 28/28 routes |
| — | **CloudinaryStorageProvider** implemented (official SDK, streaming upload, image/PDF resource-type handling), `LocalDiskStorageProvider` kept for dev only | 96/96 tests, 28/28 routes |
| 13A | Student Google OAuth (NextAuth), `Student` model, `/profile` page, admin/student session isolation proven by test | 101/101 tests, 29/29 routes |
| — | Telegram top announcement bar (dismissible, sessionStorage) | 101/101 tests, 29/29 routes |
| — | Mobile drawer overlay/transparency bug fix (backdrop scrim, opaque container, scroll lock) | code-verified (DOM layers, backdrop, scroll-lock) |
| 14 | rajtest.in-style discovery: `examTags` array, `difficulty` (easy/medium/hard), `attemptCount` counter, `/exam/[examSlug]`, `/subject/[subjectSlug]`, enhanced `/quizzes` browse chips | 106/106 tests, 79 routes compiled (31 static pages) |
| 13B | Student Persisted Attempts & Leaderboard: `QuizAttempt.studentId`, `GET /api/student/attempts`, `GET /api/leaderboard`, `/leaderboard` podium page, student `/profile` real attempt history table | 106/106 tests, 79 routes compiled (31 static pages) |
| — | Admin CMS Consolidation & Settings: `/admin/settings` (singleton metadata + password rotation API), unified `AdminSidebar`/`AdminHeader` layout for all `/admin/*` pages | 106/106 tests, 79 routes compiled (31 static pages) |
| 13C | Weak-Topic Analysis: `AnalyticsService.getStudentWeakTopics`, `GET /api/student/weak-topics` & `/api/students/me/weak-topics`, min sample size 5+ threshold, ranked weakest-first, `/profile` focus & weak topics section | 111/111 tests, 81 routes compiled (31 static pages) |

---

## 4. QUIZ ENGINE — WHAT EXISTS

Full inventory (do not rebuild any of this — extend only):

- **Models:** `Quiz`, `QuizQuestion`, `QuizAttempt` (`server/models/`)
- **Repos/Services:** `server/repositories/quiz*.ts`, `server/services/quiz-service.ts`
- **API:** `GET/POST /api/quizzes`, `POST /api/quizzes/import`,
  `GET/PUT/DELETE /api/quizzes/[id]`, `POST /api/quizzes/[id]/publish|unpublish`,
  `POST /api/quizzes/[id]/attempts`, `PUT/DELETE /api/quizzes/[id]/questions/[questionId]`,
  `GET /api/quizzes/slug/[slug]`
- **Admin UI:** `/admin/quizzes`, `/admin/quizzes/import`, `/admin/quizzes/[id]/edit`
- **Public UI:** `/quizzes`, `/quizzes/[slug]`, `/quizzes/[slug]/attempt`,
  `/quizzes/[slug]/result`, `/quiz-tools/create` (the copyable AI-prompt
  page for converting a paper into quiz JSON)
- **Guest mode preserved:** anyone can take a quiz and get scored without
  logging in; only logged-in attempts persist to history (as of 13A —
  persistence itself is 13B, not yet built, see §5).

The exact JSON schema this system accepts (embedded in `/quiz-tools/create`):
```
{
  "quizTitle": "string",
  "subject": "string",
  "questions": [{
    "questionText": "string",
    "options": ["string", ...],       // 2-6 items
    "correctOptionIndex": 0,          // 0-based
    "explanation": "string",
    "marks": 1,
    "negativeMarks": 0.33
  }]
}
```
Hard cap: 300 questions per import file. `correctOptionIndex`/`explanation`
are NEVER exposed to the public pre-attempt endpoint — only after scoring.

---

## 5. ⚠️ UNCONFIRMED / BLOCKING — DO THESE FIRST, BEFORE ANY NEW FEATURE WORK

These are open loops. Do not start Batch 14 or any Student-Accounts
sub-batch (13B+) until these are resolved.

1. **Mobile drawer bug — visual fix NOT yet confirmed.** A fix was coded
   and pushed (commit `ca24fdc`) after a reported bug (drawer content
   bleeding through, transparent overlay, footer rendering mid-page). The
   coding agent explicitly stated it could NOT capture a screenshot to
   verify — no automated visual verification tool is installed
   (Playwright/Puppeteer are absent from the repo). **A human must check
   this on a real device or browser devtools mobile emulation (~375px)
   before it's considered done.** If still broken, treat as a live bug,
   not a nice-to-have.

2. **Vercel production deployment — never explicitly confirmed end-to-end.**
   A build-blocking duplicate-route bug (ENOENT on
   `page_client-reference-manifest.js`) was found and fixed. After that
   fix, no one has confirmed: (a) a Vercel deploy of a post-fix commit
   actually shows "Ready" in the dashboard, (b) the live URL actually
   loads correctly, (c) all required env vars are actually set in Vercel
   project settings. Required env vars: `DATABASE_URL` (Mongo Atlas URI),
   `JWT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_SITE_URL`, `MEDIA_PROVIDER=cloudinary`,
   `CLOUDINARY_URL`.

3. **Production admin account — never confirmed seeded.** The seed script
   (`scripts/seed.ts` via `npm run db:seed`) needs to be run once against
   the REAL production `DATABASE_URL` (Atlas), not just local dev. Until
   this is done, `/admin/login` will not work on the live site.

4. **Google OAuth credentials — never confirmed created.** For Student
   Google Login (13A) to work in production, a real Google Cloud Console
   OAuth Client ID/Secret must exist with the correct authorized redirect
   URI (`https://<domain>/api/auth/callback/google`). Check
   `DEPLOYMENT.md` §8 (added in 13A) for the exact steps — these have not
   been confirmed as actually completed.

5. **Batch 8 "Full Regression" was accepted with caveats, not fully clean.**
   Specifically:
   - The "real non-synthetic HTML import" check reused an EXISTING
     unit-test fixture rather than a fresh dry-run through the live
     admin UI with genuinely new files.
   - "Core User Flows" were verified via code-path review, not an actual
     click-through or Playwright E2E run — no E2E tooling was ever
     installed in this project despite `TESTING.md` calling for it.
   - "Mobile UI" check (#15 on the critical test list) was based on
     Tailwind breakpoint review, not an actual viewport screenshot.
   These are lower priority than items 1-4 above but should be closed out
   with a genuine human click-through before calling v1 "done."

6. **The user's real legacy HTML notes have NOT yet been imported.** This
   was the original core motivation for the entire project and has not
   happened yet — see §7 for the exact workflow.

---

## 6. CONFIGURATION / SECRETS REFERENCE

Real values already decided (do not invent placeholders — use these):

```
Telegram:  https://t.me/+9lJuoxlqJdsxMDY1
Instagram: https://www.instagram.com/examtwister/
X:         https://x.com/examtwister
YouTube:   https://www.youtube.com/@ExamTwister
```
Stored in `server/lib/social-links.ts` as static constants (chosen over
a Settings-DB approach since these rarely change).

Brand assets: `public/brand/logo.png`, `public/brand/banner.png` (+
generated favicon/app-icon variants). Color palette was PIXEL-SAMPLED
from the actual logo file, not invented:
- Deep navy: `#0B132B` / `#001020` / `#001030`
- Gold/saffron: `#F59E0B` / `#FFB800`
- Crimson (from the turban/pagdi detail): `#DC2626` / `#D32F2F`
- Light neutrals: `#FAF8F5` background / `#EAE5DC` borders

Typography: Sora + Noto Sans Devanagari (headings, bilingual), Plus
Jakarta Sans (body), loaded via `next/font`.

---

## 7. HOW TO IMPORT THE USER'S REAL LEGACY HTML NOTES (do this once §5 items 1-3 are resolved)

1. Put all `.html` files in one folder. If any reference images via
   relative path (not base64), include those image files in the same
   upload batch — filename-matched resolution.
2. Go to `/admin/notes/import`.
3. Upload in batches of ≤50 files at a time.
4. Run with **Dry Run ON** first. Read the report
   ("N files found, X valid, Y duplicate, Z failed") and fix any
   `FAILED` reasons (usually a missing referenced image).
5. Re-submit with **Dry Run OFF** — creates DRAFT notes (never
   auto-publishes, this is a hard-coded safety rule, do not change it).
6. Go to `/admin/notes`, filter to Drafts, spot-check a few for
   formatting/category/tags, then use the **Bulk Select + Publish**
   feature (built and verified — checkbox column + "Publish Selected"
   action bar) to publish many at once instead of one-by-one.
7. If an import batch goes wrong, use the Rollback action on that
   specific `ImportJob` (only removes untouched drafts, never anything
   edited/published since).

---

## 8. PENDING WORK — NOT YET BUILT

### 8a. High priority (core product completion)
- Resolve all of §5 (drawer visual confirm, live deploy confirm, admin
  seed, OAuth creds, real HTML import, genuine E2E pass).
- SEO+AEO blog content — a reusable prompt exists (see
  `/blog-tools/create` if built, or the standalone prompt given
  separately) for converting raw exam updates into publish-ready,
  AI-answer-engine-optimized blog posts. Actual content has not yet been
  written/published using it.
- Google Search Console setup (manual, account-level — submit sitemap,
  verify domain, request indexing) — cannot happen until live deploy is
  confirmed.

### 8b. Batch 14 — rajtest.in-style discovery (COMPLETED & VERIFIED)
- Exam-wise tagging on Quiz (`examTags` array — RPSC/REET/CET/Patwar/RSSB, many-to-many, distinct from Category)
- Difficulty field (easy/medium/hard, admin-set, not auto-calculated)
- Attempt counter (`attemptCount` auto-incrementing on every quiz attempt)
- `/exam/[examSlug]` and `/subject/[subjectSlug]` public browse pages
- "Browse by Exam" / "Browse by Subject" / Difficulty chip sections on `/quizzes`

### 8c. Sub-Batches 13B–13E — Student Accounts feature set
- **13A (COMPLETED):** Student Google OAuth (NextAuth), `Student` model, `/profile` page, session isolation.
- **13B (COMPLETED):** Persisted Attempts + Leaderboard: `QuizAttempt.studentId`, `GET /api/student/attempts` API, `GET /api/leaderboard` aggregation API, `/leaderboard` podium page, student `/profile` real attempt history table.
- **13C (COMPLETED):** Weak-Topic Analysis: `AnalyticsService.getStudentWeakTopics`, `GET /api/student/weak-topics` & `/api/students/me/weak-topics` APIs, min sample size 5+ threshold, ranked weakest-first, `/profile` focus & weak topics section with progress indicators and targeted practice links.
- **13D (NEXT):** **Wrong-Question Notebook:** derived-or-stored wrong-answer
  tracking + independent bookmark feature, `/profile/notebook` page.
- **13E:** **Booster Test Generation:** assemble a new practice set from a
  student's weakest subjects using EXISTING questions only (no AI
  generation on the server) — decide and document whether this is a
  persisted Quiz row or ephemeral.

Each of these has a full detailed prompt already written in project
history (see the "BATCH 13" master prompt) — reuse verbatim, do not
re-derive from scratch. Rule established: implement strictly in order
(13B before 13C before 13D before 13E), verify+commit+STOP after each
one, never merge sub-batches.

### 8d. Smaller future ideas (not scoped into a batch yet, low priority)
- PWA installability (rajtest.in has this)
- View/analytics tracking system (explicitly deferred multiple times —
  needed before "Most Read"/"Trending" can be more than "Most Recent")
- Comments, newsletter/email system (explicitly out of scope so far)
- A dedicated `/blog-tools/create` page mirroring `/quiz-tools/create`
  for the SEO+AEO blog prompt (optional convenience, prompt already
  exists standalone)

---

## 9. HARD RULES THAT MUST NOT BE VIOLATED BY ANY FUTURE WORK

These were established across many batches and must continue to hold:

1. HTML import (single or bulk) NEVER auto-publishes — always lands as
   `DRAFT`. No code path should ever set `status=PUBLISHED` from the
   import pipeline.
2. All user-authored and imported HTML is sanitized server-side
   (`sanitize-html`, strict allow-list) BEFORE storage, not just before
   render. Never trust or render raw HTML from any source.
3. Admin auth and Student auth are fully independent systems — neither
   session type may ever grant access controlled by the other.
4. `/admin` must never be linked from any public-facing page, nav, or
   footer — reachable only by typing the URL directly.
5. Quiz scoring is always computed server-side from stored correct
   answers — a client-submitted score must never be trusted.
6. `correctOptionIndex`/`explanation` for quiz questions must never be
   exposed via the pre-attempt public API — only after an attempt is
   submitted, and only for that attempt's own questions.
7. Media is never stored as DB blobs — always object storage (Cloudinary
   in production) with metadata-only rows in Mongo.
8. No social media auto-posting (Telegram/Instagram/X/Threads
   automation) — the `ContentService` boundary is reserved for this but
   nothing beyond an empty adapter-folder stub should exist.
9. No new user-facing features should require re-litigating the
   MongoDB/Mongoose decision, the modular-monolith decision, or the
   single-admin/separate-student-auth split — these are closed
   decisions.
10. Every batch/patch must be verified with a genuinely CLEAN, FINAL,
    back-to-back run of `npx vitest run`, `npm run typecheck`, and
    `npm run build` — report real numbers, not "launched, standing by."
    If anything fails, fix and re-verify before reporting complete.
11. When a requirement is ambiguous, state the assumption explicitly
    rather than guessing silently — this has been the standing rule
    since Batch 1's `AI_RULES.md` and applies to all future work too.

---

## 10. RECOMMENDED NEXT-STEPS ORDER

```
1. Human: verify mobile drawer fix visually (§5.1)
2. Human: confirm Vercel deploy is "Ready" + all env vars set (§5.2)
3. Human/Agent: run production admin seed script (§5.3)
4. Human: confirm Google OAuth credentials exist and work (§5.4)
5. Human: import real legacy HTML notes via /admin/notes/import (§7)
6. Human: publish 2-3 SEO+AEO blogs using the existing prompt
7. Human: submit sitemap to Google Search Console
8. THEN, if desired: Batch 14 (exam/subject browse) — spec ready
9. THEN, if desired: Sub-Batch 13B onward (leaderboard/accounts feature)
   — only if student accounts are genuinely wanted; this is optional
   scope, not required for the core product to be complete
```

Do not skip ahead to step 8/9 while 1-7 remain unresolved — those are
live-site correctness/launch issues, not feature requests.