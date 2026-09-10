# CONTENT_IMPORT.md

## 1. Principle

Imported HTML is **untrusted input**. It is never executed, never trusted for formatting decisions, and never auto-published.

## 2. Pipeline

```
.html file
  → read as text
  → parse with cheerio
  → detect title (priority: <title> → first <h1> → filename fallback)
  → extract body (largest content block / <body> contents)
  → extract <img> tags → download/re-host each to Media Library (base64 or
    relative-path images are resolved against the uploaded file if possible;
    unresolvable images are flagged, not silently dropped)
  → sanitize body with sanitize-html (strict allow-list, see §4)
  → compute content hash for duplicate detection
  → create Note (or Blog, if operator selects "import as blog") with status=DRAFT
  → write ImportLog row: SUCCESS / DUPLICATE / FAILED + reason
```

## 3. Supported HTML

Headings (`h1`–`h4`), paragraphs, `strong`/`em`/`b`/`i`, ordered/unordered lists, tables (`table`/`thead`/`tbody`/`tr`/`td`/`th`), links (`href` only, `rel="noopener noreferrer"` forced), images (`src`, `alt`), line breaks, blockquotes.

## 4. Unsupported / Stripped HTML

- `<script>`, `<style>` blocks — removed entirely, never parsed for content.
- All inline event handlers (`onclick`, `onerror`, etc.) — stripped.
- `<iframe>`, `<object>`, `<embed>` — stripped.
- Inline `style` attributes — stripped by default (formatting is normalized to the site's typography instead of preserving arbitrary legacy CSS); this is a deliberate trade-off, flagged as an assumption per AI_RULES.md, since "preserve formatting" and "don't trust arbitrary HTML/CSS" are in tension. If visual fidelity turns out to matter more than expected, a safe CSS allow-list (font-weight, text-align only) can be added later.
- `javascript:` URLs in any `href`/`src` — stripped, link/image dropped with a logged reason.

## 5. Sanitization

`sanitize-html` with an explicit allow-list of tags/attributes (§3). Default-deny for everything else. Run server-side only, never trust client-side sanitization.

## 6. Image Handling

- Images referenced by relative path inside the uploaded HTML are resolved if the admin uploads them alongside the HTML in the same batch (matched by filename); otherwise flagged as `FAILED` (partial) with reason `"image not found: logo.png"` so the admin can attach it manually post-import.
- Base64-embedded (`data:` URI) images are decoded and uploaded to Media Library directly.
- Every imported image gets a placeholder `altText` (derived from filename or nearby heading) that the admin should review — never left silently empty on a published page.

## 7. Duplicate Detection

Two checks, both logged:
1. **Slug collision** — generated slug already exists → treated as likely duplicate, logged as `DUPLICATE`, no new row created (admin can force-import via a distinct "Import anyway" action if it's a legitimate near-duplicate).
2. **Content hash match** — SHA-256 of sanitized body matches an existing Note exactly → `DUPLICATE`.

## 8. Import Logs

Every run creates one `ImportJob` and one `ImportLog` row per file, with `result` (`SUCCESS`/`DUPLICATE`/`FAILED`) and a human-readable `reason` for anything other than clean success. The admin UI shows this as a table immediately after the run (see UI_SPEC.md §2 Import).

## 9. Rollback Strategy

- Since every import lands as `DRAFT`, "rollback" for v1 means: delete the created draft(s) from `/admin/notes`. No separate rollback endpoint is needed because nothing is ever auto-published.
- For a fully failed batch, the admin can delete the whole `ImportJob`'s created notes from the job detail page in one action (`DELETE /api/import/jobs/:id` cascades to delete only the Notes it created that are still in `DRAFT` and unedited — never touches a note the admin has since published or edited).

## 10. Bulk Import

```
Multiple .html files (+ optional loose image files)
  → POST /api/import/html (multipart, dryRun=true first)
  → validation report: "100 files found, 92 valid, 5 duplicate, 3 failed"
  → admin reviews report
  → re-run with dryRun=false → creates 92 drafts
  → admin reviews/edits/publishes individually
```

v1 runs this synchronously within the request for reasonable batch sizes (roughly ≤50 files per request, chunked client-side if more). If the real volume turns out to be in the thousands (see README Open Questions), upgrade to a background job queue (e.g. a simple DB-backed job table processed by a cron/serverless function) without changing the API contract.
