# UI_SPEC.md

Mobile-first. No large component libraries beyond shadcn/ui primitives. No unnecessary animation.

## 1. Public Site

- **Home (`/`)** — hero/tagline, featured blogs, recent notes by category, search bar.
- **Blogs list (`/blogs`)** — paginated cards (cover image, title, excerpt, category, date). Filter by category/tag.
- **Blog detail (`/blogs/[slug]`)** — title, meta (date, author, reading time), rendered HTML content, tags, related blogs.
- **Notes list (`/notes`)** — same pattern as blogs, filterable by subject/category/tag.
- **Note detail (`/notes/[slug]`)** — title, subject/category, rendered content interleaved with ordered images (with captions/alt text), optional PDF download link.
- **Search (`/search?q=`)** — combined Blog + Note results, grouped by type.
- **About (`/about`)** — static page.

Each list/detail page defines: loading skeleton, empty state ("No notes in this category yet"), and error state (retry button).

## 2. Admin

- **Login (`/admin/login`)** — email + password, single form, clear error on bad credentials, rate-limit message if throttled.
- **Dashboard (`/admin`)** — cards: total/published/draft blogs, total/published/draft notes, recent content list, recent import jobs, media count. No vanity analytics.
- **Blogs**
  - `/admin/blogs` — table: title, status, category, updated date; filters for status; search box.
  - `/admin/blogs/new` and `/admin/blogs/[id]/edit` — title field, Tiptap editor, sidebar with excerpt/cover image/category/tags/SEO fields (collapsed by default), Save Draft / Preview / Publish buttons.
  - `/admin/blogs/drafts` — filtered view of `/admin/blogs`.
- **Notes**
  - `/admin/notes` — same table pattern as blogs, plus a "subject" column.
  - `/admin/notes/new` / edit — title, subject, editor (supports pasted content), image uploader with drag-to-reorder + per-image caption/alt fields, optional PDF attach, Save Draft / Preview / Publish.
  - `/admin/notes/import` — file dropzone (single or multiple `.html`), "Dry run" toggle, submit → shows per-file result table (Success/Duplicate/Failed + reason) → "Create Drafts" confirmation for non-dry-run.
- **Media (`/admin/media`)** — grid of thumbnails, search, upload button, click-to-edit alt text/caption, delete (blocked with a clear message if in use).
- **Categories (`/admin/categories`)** — simple list + add/rename/delete (blocked if in use).
- **Tags (`/admin/tags`)** — simple list + delete.
- **Settings (`/admin/settings`)** — site title, tagline, contact email.

## 3. Editor Behavior

- Tiptap toolbar: headings, bold/italic, lists, links, image insert (from Media Library), table (basic), HTML source view toggle (for power-user paste fixes).
- Paste from Word/Google Docs/legacy HTML is cleaned automatically (Tiptap's paste rules + a sanitize pass on save).

## 4. Preview

- Preview renders the exact same content component used on the public detail page, fed with unsaved draft state — no separate preview template to maintain (see ARCHITECTURE.md — one rendering path, reused).

## 5. Destructive Actions

- Delete (Blog, Note, Media, Category, Tag) always shows a confirmation dialog naming the item; Media/Category/Tag deletion is blocked outright (not just warned) if still referenced elsewhere.

## 6. Responsive Rules

- Admin tables collapse to stacked cards under 640px.
- Public content pages target readable line-length (max ~72ch) and large tap targets for nav/filters on mobile.
