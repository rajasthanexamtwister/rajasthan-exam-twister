# PROJECT_PDR.md — Product/Design Requirements

## 1. Problem Statement

Rajasthan exam aspirants need a simple, trustworthy place to read GK notes and current-affairs blogs. The operator already has a large body of GK notes as standalone HTML files and needs a system that lets one person manage everything without a developer's help for day-to-day publishing.

## 2. Goals (v1)

1. Publish and manage Blogs.
2. Publish and manage Notes (text, HTML, and image-heavy).
3. Import existing HTML notes without manually retyping them.
4. Make content creation fast enough for one person (minutes, not hours).
5. Give public visitors a fast, mobile-first reading experience with search.
6. Keep the architecture extensible for future social distribution — without building it now.

## 3. Non-Goals (v1)

- Social auto-posting (Telegram/Instagram/X/Threads)
- Multi-admin roles/permissions
- Content version history / rollback beyond draft state
- Comments, user accounts, or public registration
- AI-generated content features
- A dedicated search engine (Elasticsearch, Algolia, etc.)

## 4. Primary Persona

**The Admin (you):** a single content manager who writes/pastes/imports notes and blogs, uploads images, and hits publish. Values speed and simplicity over configurability.

**The Student (public visitor):** browses on mobile, searches for a topic, reads a note or blog, expects fast loads and clear structure.

## 5. Content Model (high level)

### Blog
Required: `title`, `slug`, `content`, `status`.
Optional: `excerpt`, `coverImage`, `category`, `tags`, `metaTitle`, `metaDescription`, `canonicalUrl`, `readingTime`, `featured`, `author`, `publishedAt`.
Status: `DRAFT` → `PUBLISHED` → (optionally) `ARCHIVED`.

### Note
Required: `title`, `content` (HTML), `status`.
Optional: `subject`, `category`, `tags`, `images[]`, `pdfAttachment`, `source`.
Same status lifecycle as Blog.

### Category / Tag
Categories are a fixed, curated list (Rajasthan GK, History, Geography, Polity, Current Affairs, REET, RPSC, CET, Rajasthan Police, …) editable by the admin. Tags are freeform and many-to-many with Blogs/Notes.

### Media
Every uploaded file (image or PDF) is one `Media` row: URL, alt text, dimensions, size, mime type — reusable across many Blogs/Notes.

### ImportJob / ImportLog
One `ImportJob` per bulk-import run; one `ImportLog` row per file processed within it, recording success/failure/duplicate/reason.

## 6. Core User Flows

**Create a blog:** Admin → New Blog → title + paste/write content → optional cover image → Save Draft → Preview → Publish.

**Create an image-based note:** Admin → New Note → title → upload/order images with captions → short text between images → Preview → Publish.

**Import legacy HTML:** Admin → Import HTML → upload file(s) → system parses/sanitizes/extracts title+body+images → creates Draft(s) → Admin reviews/corrects → Publish.

**Public read:** Visitor → Home or Search → Blog/Note listing → Detail page → (optionally) related content.

## 7. Success Criteria

- Admin can go from "have an HTML file" to "published note" in under 5 minutes for a typical file.
- Admin can write and publish a new blog in under 10 minutes.
- Public pages load fast on 3G/4G mobile (see `SEO.md` / performance targets).
- Zero imported HTML ever executes script content (see `SECURITY.md`).

## 8. Priorities (in order)

1. Easy content management
2. Existing HTML migration
3. Image-based notes
4. Blog CMS
5. Reliable admin auth
6. Mobile public website
7. Security
8. SEO
9. Future social-integration readiness (boundary only, not implementation)
