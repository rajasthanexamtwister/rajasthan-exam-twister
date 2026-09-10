# DEVELOPMENT_PLAN.md

Vertical slices only — each batch ships frontend + API + DB together. Do not build all frontend first or all backend first.

## Batch 1 — Foundation

**Objective:** Repo scaffold, database, admin auth, protected shell.
**Modules:** `prisma/schema.prisma` (Admin model + shared enums), `server/lib/auth.ts`, `app/api/auth/*`, `app/admin/login`, `app/admin/layout.tsx` (guard), `app/admin/page.tsx` (empty dashboard shell).
**Tasks:** Next.js + TS + Tailwind + shadcn/ui scaffold; Prisma + MongoDB connection; seed script for the one admin account; JWT cookie login/logout; route guard.
**Tests:** login success/failure, unauthorized access to `/admin` redirects to login, logout clears session.
**Acceptance:** Admin can log in, see an empty dashboard, log out; direct navigation to `/admin` while logged out redirects to login.

## Batch 2 — Blog CMS

**Objective:** Full blog lifecycle, public + admin.
**Modules:** `Blog` Prisma model, `server/repositories/blog.ts`, `server/services/blog-service.ts`, `app/api/blogs/*`, `app/admin/blogs/*`, `app/(public)/blogs/*`.
**Tasks:** CRUD + publish/unpublish + delete-with-confirm; Tiptap editor integration; slug generation + collision handling; public list/detail pages with SSR.
**Tests:** create/edit/draft/publish/unpublish/delete blog (API + UI); duplicate-slug handling; unpublished blog returns 404 to public.
**Acceptance:** Admin can write, save draft, preview, publish, and edit a blog; a published blog is visible and correctly rendered on the public site.

## Batch 3 — Notes CMS

**Objective:** Full note lifecycle including image-heavy notes.
**Modules:** `Note`, `Category`, `Tag`, `Media` (minimal upload-only version) Prisma models; `app/api/notes/*`, `app/api/categories/*`, `app/api/tags/*`; `app/admin/notes/*`; `app/(public)/notes/*`.
**Tasks:** Same lifecycle as Blog; ordered image uploader with captions/alt text; category/tag assignment; public list/detail with interleaved images.
**Tests:** create note with only images and no body text; reorder images; publish requires content OR images; category/tag filtering on public list.
**Acceptance:** Admin can build an image-based note end-to-end and see it correctly rendered publicly.

## Batch 4 — HTML Import

**Objective:** Safe legacy HTML import, single and bulk.
**Modules:** `ImportJob`, `ImportLog` Prisma models; `server/services/import-service.ts`; `app/api/import/*`; `app/admin/notes/import`.
**Tasks:** Parse/sanitize/extract pipeline (see `CONTENT_IMPORT.md`); dry-run mode; duplicate detection; bulk upload UI with report table; draft creation.
**Tests:** malicious script/iframe stripped; duplicate detected and logged, not re-imported; missing referenced image logged as partial failure with reason; bulk report counts match actual outcomes.
**Acceptance:** Admin can drop in a folder of legacy HTML files, dry-run to see a report, then create drafts, and every draft is safe (no executable content) and editable.

## Batch 5 — Media Library

**Objective:** Full media management, not just upload-on-the-fly.
**Modules:** `app/api/media/*` (full CRUD), `app/admin/media`, media-picker component reused inside Blog/Note editors.
**Tasks:** Grid view, search, alt/caption edit, delete-if-unused guard, reuse-existing-media picker inside editors.
**Tests:** delete blocked when media is referenced; alt text edit reflects immediately on public pages; reuse of an existing image across two notes.
**Acceptance:** Admin manages all uploaded media from one screen and can reuse images across content without re-uploading.

## Batch 6 — Search, Categories, Tags (public-facing)

**Objective:** Public discovery.
**Modules:** MongoDB text index configuration, `app/(public)/search`, category/tag public pages, `app/admin/categories`, `app/admin/tags` full CRUD.
**Tasks:** Full-text search across Blog+Note; category/tag pages; admin category/tag management with in-use delete guard.
**Tests:** search returns relevant results ranked reasonably; deleting an in-use category/tag is blocked with a clear message.
**Acceptance:** A visitor can search for a topic and find matching blogs/notes; admin can manage the taxonomy without breaking existing content.

## Batch 7 — SEO, Performance, Security Hardening

**Objective:** Production-readiness pass.
**Modules:** `app/sitemap.ts`, `app/robots.ts`, `generateMetadata` across content pages, JSON-LD, image optimization (`next/image`), rate limiting on auth/import/upload, CSP header.
**Tasks:** Everything in `SEO.md` and remaining items in `SECURITY.md` not already covered by earlier batches.
**Tests:** sitemap includes only published content; robots blocks `/admin` and `/api`; rate limit triggers after threshold on login; CSP header present.
**Acceptance:** Lighthouse SEO score in the high 90s on a sample content page; security checklist in `SECURITY.md` fully checked off.

## Batch 8 — Full Regression + Production Build

**Objective:** Confidence before real content migration.
**Tasks:** Run full test suite; run production build; manual pass through every flow in `PROJECT_PDR.md` §6; import a real sample of legacy HTML files as a dry run against production build.
**Tests:** All of `TESTING.md`'s critical test list, green.
**Acceptance:** `npm run build` succeeds with no type errors; all tests pass; a real (non-synthetic) batch of legacy HTML imports successfully as a dry run.
