# SEO.md

## 1. URLs & Slugs

- Clean, human-readable slugs: `/blogs/reet-2026-exam-pattern`, `/notes/rajasthan-history-mughal-period`.
- Slugs are lowercase, hyphenated, generated from title, immutable after first publish (changing a slug post-publish breaks inbound links/SEO equity — editing title afterward does not regenerate the slug).

## 2. Metadata

- Each Blog/Note detail page sets `<title>`, `meta description` (from `metaTitle`/`metaDescription` if set, else derived from title/excerpt), and canonical URL via Next.js `generateMetadata`.
- Fallback description generation: strip HTML from `content`, truncate to ~155 characters at a word boundary.

## 3. Open Graph / Twitter Cards

- `og:title`, `og:description`, `og:image` (cover image or first note image), `og:type=article`, `twitter:card=summary_large_image` on every content page — this also directly benefits the future "repurpose to social" roadmap item.

## 4. Sitemap & Robots

- `app/sitemap.ts` generates `sitemap.xml` dynamically from all `PUBLISHED` Blogs/Notes plus static pages, regenerated on each build/ISR revalidation.
- `app/robots.ts` allows all public routes, disallows `/admin/*` and `/api/*`.

## 5. Structured Data

- `Article` JSON-LD schema on Blog detail pages (headline, datePublished, dateModified, author).
- `LearningResource` or `Article` schema on Note detail pages, whichever the actual rendered markup best matches — decided at implementation time based on Google's current guidance, not hardcoded here.

## 6. Headings & Content Structure

- Exactly one `<h1>` per page (the title); imported/authored body content starts at `<h2>` to preserve document outline — enforced by the editor's heading level options and by the import pipeline demoting any imported `<h1>` inside the body to `<h2>`.

## 7. Image Alt Text

- Every `Media` row has an `altText` field; public rendering never omits `alt` — falls back to the note/blog title if truly unset, but the admin UI nags (non-blocking) when publishing content with images missing custom alt text.

## 8. Internal Linking

- Related content: "More in [Category]" block on every detail page (simple query: same category, excluding self, most recent 3–5).
- Category and tag pages (`/blogs?category=...`, `/notes?tag=...`) provide natural internal link hubs.

## 9. What's Deliberately Skipped in v1

- Multi-language/hreflang (single-language site for now).
- AMP (not worth the maintenance cost at this scale).
- Automatic keyword optimization tooling — content quality and correct metadata are enough for v1.
