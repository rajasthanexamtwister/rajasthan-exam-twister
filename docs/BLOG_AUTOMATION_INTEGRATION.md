# Blog Automation Integration Specification
## External AI Engine (`rajasthan_exam_blogs`) & Rajasthan Exam Twister CMS

---

## 1. Executive Summary & System Boundary

This document outlines the architecture, integration contract, security boundary, scheduling system, and verification gates for integrating the external AI blog-generation engine (**`rajasthan_exam_blogs`**) into the existing **Rajasthan Exam Twister** website/CMS.

### 1.1 Architecture & Separation of Concerns

```
                  ┌──────────────────────────────┐
                  │          AI ENGINE           │
                  │     rajasthan_exam_blogs     │
                  │                              │
                  │  - Topic Discovery           │
                  │  - Deep Source Research      │
                  │  - Fact Claim Extraction     │
                  │  - Content/FAQ/MCQ Gen       │
                  │  - Editorial QA Validation   │
                  │  - Featured Image Gen        │
                  └──────────────┬───────────────┘
                                 │
                                 │ Authenticated Server-to-Server
                                 │ API (x-internal-api-key / Bearer)
                                 ▼
                  ┌──────────────────────────────┐
                  │    WEBSITE CMS API LAYER     │
                  │                              │
                  │  - Strict Zod Validation     │
                  │  - HTML Sanitization         │
                  │  - Taxonomy Resolution       │
                  │  - Image Persistence         │
                  └──────────────┬───────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
    ┌───────────────────────┐         ┌───────────────────────┐
    │     Blog (DRAFT)      │         │     BlogResearch      │
    │  (Existing Collection)│         │ (Audit & Verification)│
    └───────────┬───────────┘         └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │    BlogAutomationJob  │
    │   (Queue & Metadata)  │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │  Admin Content Queue  │
    │  & Scheduler Engine   │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │ Pre-Publish Safeguards│
    │ (Current Affairs, QA) │
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │  Human Admin Approval │  (Review Required Mode v1)
    └───────────┬───────────┘
                │
                ▼
    ┌───────────────────────┐
    │    PUBLISHED BLOG     │
    │ (Sitemap, SEO, Web)   │
    └───────────────────────┘
```

### 1.2 Invariant System Rules

1. **Source of Truth:**
   - **Website CMS:** Owns blog persistence, blog status (`DRAFT`, `PUBLISHED`, `ARCHIVED`), taxonomy (categories, tags), media storage (Cloudinary), authentication, permissions, public rendering, SEO metadata, sitemaps, robots.txt, and final publication.
   - **External AI Engine (`rajasthan_exam_blogs`):** Owns topic discovery, multi-source research, claim verification, article drafting, FAQ/MCQ synthesis, and editorial QA scoring.
2. **Draft First:** Every generated article is persisted with `Blog.status = "DRAFT"` and `scheduleStatus = "UNSCHEDULED"`.
3. **Zero Direct Client Trust:** AI payloads are never accepted directly from client browsers. All ingestion flows through authenticated server-side endpoints.
4. **Human Approval in v1:** `REVIEW_REQUIRED = true`. Automatic publishing is strictly disabled by default in v1.
5. **No Schema Breakage:** Existing models, APIs, and public routes remain backwards-compatible.

---

## 2. Phase 0 — Repository Audit Findings

| Component | Audit Observation | Implementation Decision |
|---|---|---|
| **1. Next.js Version** | Next.js 14.2.35 | Full App Router route handlers and Server/Client components. |
| **2. App Router Structure** | `app/(public)` for student views, `app/admin` for CMS dashboard, `app/api` for HTTP handlers. | Add `/admin/blog-automation`, `/api/admin/blog-automation/*`, `/api/internal/blog-automation/*`, and `/api/cron/blog-publisher`. |
| **3. Blog Model/Schema** | `server/models/Blog.ts` with `title`, `slug`, `excerpt`, `content`, `coverImageId`, `categoryId`, `tagIds`, `status` (`DRAFT`/`PUBLISHED`/`ARCHIVED`), `metaTitle`, `metaDescription`, `canonicalUrl`, `readingTime`, `featured`, `author`, `publishedAt`. | Retain `Blog` model untouched; create `BlogAutomationJob` and `BlogResearch` for metadata and research audit. |
| **4. Blog Service/Repo** | `server/repositories/blog.ts` & `server/services/blog-service.ts` handle CRUD, slug generation, publishing, and reading time. | Reuse `BlogService.createBlog`, `updateBlog`, and `publishBlog` directly. |
| **5. Blog API Routes** | `/api/blogs` (GET, POST), `/api/blogs/[id]` (GET, PUT, DELETE), `/api/blogs/[id]/publish`, `/api/blogs/[id]/unpublish`, `/api/blogs/slug/[slug]`. | Existing routes remain untouched; automation operations are isolated under dedicated routes. |
| **6. Admin Blog Pages** | `/admin/blogs` (listing), `/admin/blogs/new`, `/admin/blogs/[id]`, `/admin/blogs/drafts`. | Link automation queue and generated drafts seamlessly to `/admin/blogs/[id]`. |
| **7. Blog Editor** | `components/admin/blog-form.tsx` using TipTap WYSIWYG editor. | Auto-fills generated title, HTML content, excerpt, SEO fields, category, tags, and cover image. |
| **8. Publish/Unpublish APIs** | `POST /api/blogs/[id]/publish` requires Admin session; updates `status: PUBLISHED`, `publishedAt`. | Scheduler calls atomic internal publish service with pre-publish validation. |
| **9. Category Model/API** | `server/models/Category.ts`, `server/services/category-service.ts`. | Automatic category resolution (by slug or name) with safe fallback to matching category. |
| **10. Tag Model/API** | `server/models/Tag.ts`, `server/services/tag-service.ts`. | Tag resolution and safe upsert for generated tags. |
| **11. Media Model/API** | `server/models/Media.ts`, `server/services/media-service.ts`. | Integrates AI-generated cover images into Media collection. |
| **12. Cloudinary Integration** | `server/lib/media-storage.ts` with Cloudinary upload stream. | Supports direct URL upload to Cloudinary with `imageStatus` tracking. |
| **13. Auth & Authorization** | `server/lib/token.ts` (JWT admin cookie `auth_token`), `middleware.ts` guarding `/admin/*`. | Admin endpoints use `getSessionFromRequest`; internal AI endpoints use `x-internal-api-key`. |
| **14. AI Integrations** | No existing in-tree AI generator. | Clean integration with `rajasthan_exam_blogs` via `server/services/blog-automation/`. |
| **15. Cron/Scheduler** | Standard HTTP cron endpoint pattern (`/api/cron/*`). | Add `/api/cron/blog-publisher` with `CRON_SECRET` authorization. |
| **16. Environment Variables** | `.env.example` contains DB, JWT, Cloudinary, NextAuth. | Add `BLOG_ENGINE_URL`, `BLOG_ENGINE_API_KEY`, `BLOG_AUTOMATION_INTERNAL_API_KEY`, `BLOG_AUTOMATION_ENABLED`, `BLOG_AUTOMATION_DRY_RUN`, `CRON_SECRET`. |
| **17. SEO Helpers** | `server/lib/seo.ts` generates JSON-LD (Article, Breadcrumbs, Website, Org). | Preserved entirely. AI generates recommended metaTitle and metaDescription. |
| **18. Sitemap Generation** | `app/sitemap.ts` queries `Blog.find({ status: "PUBLISHED" })`. | Guaranteed isolation: draft and scheduled automation jobs never leak into sitemap. |
| **19. robots.txt** | `app/robots.ts` allows public routes, blocks `/admin/` and `/api/`. | Preserved without modifications. |
| **20. Public Blog View** | `app/(public)/blogs/page.tsx` and `app/(public)/blogs/[slug]/page.tsx`. | Only displays blogs with `status: "PUBLISHED"`. |
| **21. Test Framework** | Vitest 2.1.9 (`vitest run`). | Added comprehensive unit tests for automation validation, queue, scheduling, safeguards, and sitemap isolation. |
| **22. Scripts** | `package.json` contains tsx CLI scripts (`npm run db:seed`, etc.). | Added `npm run blog:automation:discover`, `blog:automation:batch`, `blog:automation:queue`, `blog:automation:publish`, `blog:automation:retry`. |
| **23. Deployment** | Next.js Node/Vercel serverless environment with MongoDB. | Database connection caching via `server/lib/mongodb.ts` leveraged. |

---

## 3. Data Models

### 3.1 `BlogAutomationJob` Schema

Stored in `server/models/BlogAutomationJob.ts`:

- `_id`: ObjectId
- `blogId`: ObjectId (ref: "Blog", optional until draft is created)
- `externalJobId`: string (index, unique identifier from AI engine)
- `topic`: string (required)
- `articleType`: enum (`RAJASTHAN_GK`, `CURRENT_AFFAIRS`, `EXAM_UPDATES`, `STATIC_GK`, `STUDY_GUIDE`)
- `generationStatus`: enum (`DISCOVERED`, `RESEARCHING`, `RESEARCHED`, `GENERATING`, `GENERATED`, `QA_RUNNING`, `QA_PASSED`, `QA_FAILED`, `DRAFT_CREATED`, `FAILED`)
- `researchStatus`: enum (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`)
- `qaStatus`: enum (`PENDING`, `IN_PROGRESS`, `PASSED`, `FAILED`)
- `imageStatus`: enum (`PENDING`, `GENERATING`, `READY`, `FAILED`, `SKIPPED`)
- `scheduleStatus`: enum (`UNSCHEDULED`, `QUEUED`, `SCHEDULED`, `PROCESSING`, `PUBLISHED`, `CANCELLED`, `HOLD`, `FAILED`)
- `scheduledAt`: Date (optional)
- `timezone`: string (default: `"Asia/Kolkata"`)
- `sourceCount`: number (default: 0)
- `verifiedClaimCount`: number (default: 0)
- `uncertainClaimCount`: number (default: 0)
- `conflictingClaimCount`: number (default: 0)
- `warningCount`: number (default: 0)
- `qaScore`: number (0-100)
- `generatedBy`: string (e.g. `"rajasthan_exam_blogs"`)
- `model`: string (e.g. `"gemini-1.5-pro"`)
- `dryRun`: boolean (default: false)
- `errorCode`: string (structured error code)
- `errorMessage`: string
- `isCurrentAffairs`: boolean (default: false)
- `eventDate`: Date
- `researchDate`: Date
- `lastVerifiedAt`: Date
- `requiresFreshVerification`: boolean (default: false)
- `adminApproved`: boolean (default: false)
- `approvedBy`: string
- `approvedAt`: Date
- `publishedAt`: Date
- `createdAt`, `updatedAt`: Timestamps

### 3.2 `BlogResearch` Schema

Stored in `server/models/BlogResearch.ts`:

- `_id`: ObjectId
- `automationJobId`: ObjectId (ref: "BlogAutomationJob", index)
- `blogId`: ObjectId (ref: "Blog", optional)
- `externalJobId`: string (index)
- `topic`: string (required)
- `researchDate`: Date
- `sources`: Array of `{ url, title, publisher, publishDate, snippet, confidence, isOfficial }`
- `verifiedClaims`: Array of string/object
- `uncertainClaims`: Array of string/object
- `conflictingClaims`: Array of string/object
- `seoBrief`: `{ focusKeywords, secondaryKeywords, searchIntent, metaTitleSuggestion, metaDescriptionSuggestion }`
- `internalLinks`: Array of `{ anchorText, targetSlug, reason }`
- `faqs`: Array of `{ question, answer }`
- `mcqs`: Array of `{ question, options, correctAnswer, explanation }`
- `model`: string
- `generatedBy`: string
- `createdAt`, `updatedAt`: Timestamps

---

## 4. API Endpoints Contract

### 4.1 Internal Server-to-Server Endpoints

Header required: `x-internal-api-key: <BLOG_AUTOMATION_INTERNAL_API_KEY>`

1. **`POST /api/internal/blog-automation/jobs`**
   - Initiates an automation generation job or submits finished generation payload.
2. **`GET /api/internal/blog-automation/jobs/[id]`**
   - Fetches current job status, QA scorecard, and draft mapping.

### 4.2 Admin Management Endpoints

Guarded by Admin Session Cookie + CSRF protection:

1. **`POST /api/admin/blog-automation/discover`**: Discovers candidate topics with duplicate checking.
2. **`POST /api/admin/blog-automation/generate`**: Triggers single or batch article generation.
3. **`GET /api/admin/blog-automation/queue`**: Fetches paginated content queue items with stats.
4. **`GET /api/admin/blog-automation/queue/[id]`**: Fetches complete job details, blog draft, and research audit.
5. **`PATCH /api/admin/blog-automation/queue/[id]`**: Updates schedule, hold status, cancellation, approval, or retry.
6. **`POST /api/admin/blog-automation/queue/[id]/publish`**: Manually publishes an approved draft.
7. **`POST /api/admin/blog-automation/schedule-batch`**: Batch schedules multiple queue items across intervals.

### 4.3 Scheduler Cron Endpoint

Header required: `Authorization: Bearer <CRON_SECRET>`

- **`POST /api/cron/blog-publisher`** or **`GET /api/cron/blog-publisher`**:
  - Finds scheduled jobs where `scheduledAt <= now` and `scheduleStatus = "SCHEDULED"`.
  - Atomically locks jobs with `scheduleStatus = "PROCESSING"`.
  - Executes 14-point pre-publish validation.
  - Publishes blog using `BlogService.publishBlog(id)` and marks `scheduleStatus = "PUBLISHED"`.

---

## 5. Safeguards & Error Codes

### Structured Error Codes
- `RESEARCH_FAILED`: AI engine failed to retrieve official or trusted sources.
- `GENERATION_FAILED`: Article generation synthesis failed or timed out.
- `VALIDATION_FAILED`: Ingestion payload failed strict Zod schema validation.
- `QA_FAILED`: Editorial QA score below threshold or critical policy violation.
- `IMAGE_FAILED`: Cover image generation or media upload failed.
- `CMS_SAVE_FAILED`: Database persistence failed.
- `SCHEDULE_FAILED`: Invalid schedule parameters or conflict.
- `PUBLISH_FAILED`: Pre-publish validation check failed.
- `SOURCE_CONFLICT`: Unresolved conflicting claims detected.
- `STALE_CURRENT_AFFAIRS`: Time-sensitive news requires fresh verification before release.

---

## 6. Pre-Publish Validation Checklist

Before any scheduled or queued draft is transitioned to `PUBLISHED`:
1. [x] `Blog` document exists in database.
2. [x] `Blog.status` is currently `DRAFT`.
3. [x] `scheduledAt` is due (`scheduledAt <= now`).
4. [x] `qaStatus` is `PASSED`.
5. [x] Required fields (title, slug, content) are non-empty.
6. [x] Slug is unique in database.
7. [x] Category exists and is valid.
8. [x] Tag IDs resolve properly.
9. [x] Content HTML passed sanitization (no scripts, unsafe iframes, malicious handlers).
10. [x] Cover image exists (if required for article type).
11. [x] SEO metadata (metaTitle, metaDescription) are formatted and valid.
12. [x] Zero unresolved conflicting claims.
13. [x] Idempotency lock acquired (prevents duplicate runs).
14. [x] Human admin approval confirmed (`adminApproved: true` in v1).
15. [x] Fresh verification validated for `CURRENT_AFFAIRS` / `EXAM_UPDATES`.

---

## 7. Configuration & Environment Variables

| Variable | Type | Default | Description |
|---|---|---|---|
| `BLOG_ENGINE_URL` | string | `http://localhost:8000` | URL of the external AI blog engine. |
| `BLOG_ENGINE_API_KEY` | string | `""` | API key to authenticate with `rajasthan_exam_blogs`. |
| `BLOG_AUTOMATION_INTERNAL_API_KEY` | string | `""` | Internal API key for server-to-server webhook/job calls. |
| `BLOG_AUTOMATION_ENABLED` | boolean | `false` | Master toggle for automation engine. |
| `BLOG_AUTOMATION_DRY_RUN` | boolean | `false` | Dry-run mode for simulations without persisting public blogs. |
| `BLOG_AUTOMATION_MAX_BATCH_SIZE` | number | `20` | Max batch generation size per request. |
| `BLOG_AUTOMATION_TIMEOUT_MS` | number | `30000` | HTTP timeout for external AI engine calls. |
| `CRON_SECRET` | string | `""` | Bearer secret for `/api/cron/blog-publisher`. |
