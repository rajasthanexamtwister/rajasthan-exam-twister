> **READ THIS README COMPLETELY BEFORE MODIFYING THIS PROJECT.**

# Rajasthan Exam Twister — AI-Ready Project Specification

This is a documentation-only phase. **No production code exists yet.** This pack is written so an AI coding agent (Antigravity, Claude Code, Cursor, VS Code Agent) can implement the project without asking basic architectural questions.

## 1. Project Purpose

A content-focused website for Rajasthan competitive-exam preparation (REET, RPSC, CET, Rajasthan Police, etc.), run by a single content manager. It publishes:
- **Blogs** — articles/current-affairs style posts
- **Notes** — GK/exam notes, often image-heavy, many already exist as legacy HTML files that must be imported, not rewritten

It is a **CMS first**, a public website second.

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14/15 (App Router), TypeScript, Tailwind CSS, shadcn/ui | Matches your existing Luxora/EcoGuard stack directly — no new frontend paradigm to learn |
| Backend | Next.js Route Handlers (modular monolith) | One deploy target, one repo, no infra overhead for a solo operator |
| Database | MongoDB + Prisma ORM (or Mongoose) | Schema safety, flexible document storage, and seamless MongoDB Atlas cloud hosting |
| Auth | Custom JWT in httpOnly cookie + bcrypt | You've already shipped this exact pattern in Luxora — reused, not relearned |
| Editor | Tiptap (rich text, HTML-backed) | Outputs clean HTML — same format as your legacy notes, so nothing lossy happens on import or on save |
| Media | Cloudinary or ImageKit (object storage) + MongoDB metadata collection | You've already integrated ImageKit in Luxora |
| Search | MongoDB text search (`$text` index) | Built-in text index; good enough for thousands of notes |
| Deployment | Vercel + MongoDB Atlas + Cloudinary/ImageKit | All have workable free tiers for a v1 solo project |

## 3. Architecture

See `ARCHITECTURE.md`. Summary: modular monolith inside `app/`, with a `server/` layer of services that both API routes and (later) server components call. A **Content Service** boundary sits between "published content" and everything else, so future Telegram/Instagram/X/Threads adapters can consume it without touching core CMS code.

## 4. Database

See `DATABASE.md`. Core entities: `Admin`, `Blog`, `Note`, `Category`, `Tag`, `Media`, `ImportJob`, `ImportLog`, `Settings`.

## 5. Content Model

Blogs and Notes are separate entities (see `PROJECT_PDR.md` §Content Model) but share underlying primitives: HTML body, slug, status (`DRAFT`/`PUBLISHED`/`ARCHIVED`), category, tags, media references.

## 6. HTML Import

See `CONTENT_IMPORT.md`. Legacy HTML is sanitized (never executed), parsed for title/images/body, and always lands as a **draft** for manual review before publishing. Bulk import supports dry-run + validation report.

## 7. Admin

Single admin user, no public registration. See `SECURITY.md` for the exact auth flow.

## 8. Public Website

Mobile-first. Home, Blogs (list/detail/category), Notes (list/detail/category/search), About. See `UI_SPEC.md`.

## 9. API

See `API_SPEC.md` for every endpoint, request/response shape, and validation rule.

## 10. Testing

See `TESTING.md`.

## 11. Security

See `SECURITY.md`. Imported HTML is treated as **untrusted input**, always.

## 12. Deployment

See `DEPLOYMENT.md`.

## 13. Development Batches

See `DEVELOPMENT_PLAN.md` — 8 vertical slices, each shipping frontend + API + DB together.

## 14. AI Agent Rules

See `AI_RULES.md`. Every coding agent working on this repo must read it before writing code.

## 15. Known Limitations (v1)

- No version history for content (draft/publish only — see `DATABASE.md` for rationale)
- No multi-admin RBAC
- No social auto-posting (deliberately deferred)
- Search is MongoDB text search, not a dedicated search engine

## 16. Future Roadmap

- Telegram/Instagram/X/Threads adapters consuming the Content Service
- One-click "repurpose to social" from a published Blog/Note
- Optional content versioning if the single-admin model changes

---

## FINAL ARCHITECTURAL DECISIONS

1. **Database:** MongoDB + Prisma ORM (`provider = "mongodb"`), offering schema validation, flexible documents, and cloud hosting via MongoDB Atlas.
2. **Backend shape:** Modular monolith inside the Next.js app — no separate Express server, no microservices.
3. **Auth:** Single admin, custom JWT in an httpOnly, `SameSite=Lax`, `Secure` cookie; bcrypt-hashed password; no third-party auth provider needed for one user.
4. **Editor:** Tiptap producing/consuming sanitized HTML — one format for authored content and imported legacy content.
5. **HTML import:** Always creates a `DRAFT`, never auto-publishes. Sanitization via `sanitize-html` with a strict allow-list; scripts, iframes, event handlers stripped unconditionally.
6. **Media:** Stored in object storage (Cloudinary/ImageKit), never as DB blobs. MongoDB holds metadata only.
7. **Search:** MongoDB `$text` search index on title/body/tags. Revisit only if content volume exceeds ~50k items.
8. **Social integrations:** Not built in v1. Architecture exposes a `ContentService.getPublished()` boundary so adapters can be added later without touching CMS internals.
9. **Versioning:** Not implemented in v1 — draft state + confirmation dialogs on destructive actions are judged sufficient for a single-admin system. Revisit if a second editor is added.

## OPEN QUESTIONS

These genuinely can't be decided safely without your input — everything else in this pack is a firm decision:

1. **Volume of legacy HTML notes** (dozens vs. thousands) — affects whether the bulk-import UI needs pagination/background-job processing (queue) in v1, or a simple synchronous batch is enough.
2. **Media storage provider** — Cloudinary vs. ImageKit (you've used ImageKit before; either works, this only affects a few env vars and one thin service file).
3. **Domain/hosting** — whether a custom domain is ready at deploy time (affects SEO doc's canonical URL setup, not the code itself).

## IMPLEMENTATION ORDER

1. Batch 1 — Foundation: repo scaffold, Prisma schema + migrations, admin auth, protected `/admin` shell.
2. Batch 2 — Blog CMS (frontend + API + DB together).
3. Batch 3 — Notes CMS (frontend + API + DB together).
4. Batch 4 — HTML Import (single-file, then bulk).
5. Batch 5 — Media Library.
6. Batch 6 — Search, Categories, Tags (public-facing).
7. Batch 7 — SEO, performance, security hardening pass.
8. Batch 8 — Full regression testing + production build verification.

## FINAL HANDOFF INSTRUCTIONS FOR THE CODING AGENT

```
You are implementing "Rajasthan Exam Twister" from the attached specification pack.

Before writing any code:
1. Read README.md, PROJECT_PDR.md, ARCHITECTURE.md, DATABASE.md, API_SPEC.md,
   CONTENT_IMPORT.md, SECURITY.md, DEVELOPMENT_PLAN.md in full.
2. Follow AI_RULES.md without exception.
3. Implement strictly in the batch order given in DEVELOPMENT_PLAN.md — do not
   jump ahead to later batches or build features not specified.
4. Each batch = working frontend + API + DB slice. Do not build all frontend
   first or all backend first.
5. After each batch: run typecheck, run tests, run a production build. Do not
   report a batch complete unless all three pass.
6. Never invent new architecture, libraries, or endpoints not listed in this
   pack without flagging the deviation explicitly in your response.
7. Treat all imported/legacy HTML as untrusted input per SECURITY.md and
   CONTENT_IMPORT.md — sanitize before storage, never execute scripts.
8. If a requirement is ambiguous, do not guess silently — state the
   assumption you're making and choose the safest option, per AI_RULES.md.
9. Do not implement social media automation (Telegram/Instagram/X/Threads) —
   only leave the ContentService boundary open for it, as specified.

Start with Batch 1.
```

---

## 17. Live Active Visitor System

A production-safe, privacy-focused real-time visitor presence system integrated into the Admin Dashboard.

- **Definition of "Live User":** An anonymous visitor whose heartbeat was recorded within the last **90 seconds**.
- **Heartbeat Interval:** Client presence component sends heartbeats approximately every **30 seconds** when the browser tab is active/visible (`visibilityState === "visible"`).
- **Admin Polling:** Admin Live Users card polls `GET /api/admin/presence` every **12 seconds** when tab is active.
- **Database Presence Model:** Uses `Presence` Mongoose schema indexed with a 5-minute TTL (`expireAfterSeconds: 300`) on `lastSeenAt` to cleanly purge stale records.
- **Privacy & Security:**
  - Zero PII (no IP, email, or user names recorded or exposed).
  - Session tracking uses random UUIDs stored in secure, `httpOnly` `ret_sid` client cookies.
  - Crawler/bot user-agents (`Googlebot`, `bingbot`, `curl`, etc.) and `/admin` routes are automatically filtered and excluded from visitor counts.
  - `POST /api/presence/heartbeat` is rate-limited (max 10 requests per 30s per `sessionId:ip`).
  - Live visitor count is displayed strictly in the Admin Dashboard, not on the public site.
- **API Endpoints:**
  - `POST /api/presence/heartbeat` (Public heartbeat recorder)
  - `GET /api/admin/presence` (Admin-only authenticated live visitor summary)

