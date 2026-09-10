# ARCHITECTURE.md

## 1. Shape: Modular Monolith

One Next.js app. No microservices, no separate Express server. API routes live inside the same repo as the frontend and call into a `server/` service layer that owns all business logic and Prisma access.

```
Browser (public site / admin UI)
        │
        ▼
Next.js App Router
  ├─ Server Components (read-only pages, SSR)
  ├─ Route Handlers (app/api/**)  ── auth, mutations, imports
        │
        ▼
server/ (service layer)
  ├─ services/    business logic, framework-agnostic
  ├─ repositories/ Prisma queries, one file per entity
  ├─ validation/  zod schemas shared by API + forms
  └─ lib/         auth, sanitize-html config, slugify, media client
        │
        ▼
MongoDB (Prisma)         Object Storage (Cloudinary/ImageKit)
```

## 2. Content Service Boundary (future-proofing)

`server/services/content-service.ts` exposes exactly:

```ts
getPublishedBlog(slug: string): Promise<PublishedContent>
getPublishedNote(slug: string): Promise<PublishedContent>
listRecentPublished(limit: number): Promise<PublishedContent[]>
```

`PublishedContent` is a flat, platform-agnostic shape (title, plainSummary, url, images[], tags[]). Nothing else in the app is allowed to read published content directly for external-facing purposes — this is the seam where Telegram/Instagram/X/Threads adapters attach later, each as its own module under `server/adapters/` (not built in v1, folder reserved with a `README.md` stub only).

## 3. Directory Structure

```
/
├── app/
│   ├── (public)/                # public site route group
│   │   ├── page.tsx             # home
│   │   ├── blogs/
│   │   ├── notes/
│   │   └── about/
│   ├── admin/                   # protected admin route group
│   │   ├── layout.tsx           # auth guard
│   │   ├── page.tsx             # dashboard
│   │   ├── blogs/
│   │   ├── notes/
│   │   ├── media/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── import/
│   │   └── settings/
│   └── api/
│       ├── auth/
│       ├── blogs/
│       ├── notes/
│       ├── media/
│       ├── categories/
│       ├── tags/
│       ├── import/
│       └── settings/
├── components/                  # shared UI (shadcn/ui based)
├── features/                    # feature-scoped UI: editor, media-picker, importer
├── server/
│   ├── services/
│   ├── repositories/
│   ├── validation/
│   └── lib/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── scripts/                     # one-off scripts (e.g. bulk import CLI)
├── tests/
│   ├── unit/
│   ├── api/
│   └── e2e/
└── docs/                        # this spec pack lives here
```

## 4. Server/Client Boundaries

- Public pages: React Server Components fetch directly via repositories (no internal HTTP round-trip) for speed.
- Admin pages: Client Components for anything interactive (editor, forms, drag-reorder for images), calling Route Handlers via `fetch`.
- Mutations always go through validated Route Handlers, never directly from a Server Component.

## 5. State/Loading/Error Handling

- Every list/detail page defines `loading.tsx` (skeleton) and `error.tsx` (retry) per Next.js App Router conventions.
- Empty states are explicit components (e.g. "No notes yet — create your first one") rather than blank pages.

## 6. Import Pipeline (architectural view)

```
Uploaded .html file(s)
   → server/services/import-service.ts
     → parse (cheerio)
     → sanitize (sanitize-html, strict allow-list)
     → extract title/body/images
     → persist Draft Note/Blog + Media rows
     → write ImportLog row (success/duplicate/failed + reason)
   → return report to Admin UI
```

Bulk import reuses the same single-file path in a loop; v1 runs synchronously in the Route Handler for reasonable batch sizes (see `DEVELOPMENT_PLAN.md` Batch 4 for the threshold and fallback to a background job if the "Volume of legacy HTML notes" open question resolves to "thousands").

## 7. What We Deliberately Avoided

- Separate backend service/microservices — unnecessary for one admin and one deploy target.
- Elasticsearch — MongoDB text search is sufficient at this content scale.
- A generic CMS framework (Strapi, Sanity, etc.) — the HTML-import requirement and image-note format are specific enough that a custom, small schema is simpler than fighting a generic content model.
- NextAuth/Auth0 — a single hardcoded admin account doesn't need a full auth provider; a hand-rolled JWT-cookie flow (which you've already built once) is less surface area.
