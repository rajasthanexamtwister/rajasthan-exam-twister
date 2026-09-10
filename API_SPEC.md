# API_SPEC.md

All routes under `app/api/`. All mutating endpoints require the admin session cookie unless marked **Public**. All request bodies validated with `zod`; validation failures return `400` with a field-level error map.

## Auth

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `{ email, password }` → sets httpOnly JWT cookie. `401` on bad credentials. Rate-limited (see SECURITY.md). |
| POST | `/api/auth/logout` | Admin | Clears cookie. |
| GET | `/api/auth/session` | Admin | Returns `{ email, name }` or `401`. |

## Blogs

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/blogs` | Public | Query: `status` (admin-only filter), `category`, `tag`, `page`, `pageSize`. Public callers only ever see `PUBLISHED`. |
| GET | `/api/blogs/:slug` | Public | `404` if not found or not published (unless admin, for preview). |
| POST | `/api/blogs` | Admin | Create. Body: `title` (required), `content` (required), `excerpt`, `coverImageId`, `categoryId`, `tagIds[]`, `metaTitle`, `metaDescription`, `canonicalUrl`, `featured`, `author`. Slug auto-generated. Status defaults `DRAFT`. |
| PATCH | `/api/blogs/:id` | Admin | Partial update, same fields as create. |
| POST | `/api/blogs/:id/publish` | Admin | Sets `status=PUBLISHED`, `publishedAt=now()`. `400` if `content` empty. |
| POST | `/api/blogs/:id/unpublish` | Admin | Sets `status=DRAFT`. |
| DELETE | `/api/blogs/:id` | Admin | Hard delete; requires `?confirm=true` or `409`. |

## Notes

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/notes` | Public | Query: `subject`, `category`, `tag`, `q` (search), `page`, `pageSize`. |
| GET | `/api/notes/:slug` | Public | `404` if not found/not published (unless admin). |
| POST | `/api/notes` | Admin | Body: `title` (required), `content` (required, may be empty string if image-only note — see note below), `subject`, `categoryId`, `tagIds[]`, `imageIds[]` (ordered), `pdfMediaId`, `source`. |
| PATCH | `/api/notes/:id` | Admin | Partial update. |
| POST | `/api/notes/:id/publish` | Admin | Requires `content` OR at least one image. |
| POST | `/api/notes/:id/unpublish` | Admin | — |
| DELETE | `/api/notes/:id` | Admin | Requires `?confirm=true`. |

> Image-only notes: `content` may legitimately be short/empty; validation requires `content.length > 0 OR imageIds.length > 0`.

## Media

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| GET | `/api/media` | Admin | Query: `q`, `mimeType`, `page`. |
| POST | `/api/media` | Admin | `multipart/form-data`. Validates MIME + size (see SECURITY.md). Uploads to object storage, returns `Media` row. |
| PATCH | `/api/media/:id` | Admin | Update `altText`, `caption`. |
| DELETE | `/api/media/:id` | Admin | `409` if referenced by any Blog/Note (must detach first). |

## Categories

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/categories` | Public |
| POST | `/api/categories` | Admin |
| PATCH | `/api/categories/:id` | Admin |
| DELETE | `/api/categories/:id` | Admin — `409` if in use |

## Tags

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/tags` | Public |
| POST | `/api/tags` | Admin |
| DELETE | `/api/tags/:id` | Admin — detaches from all content first |

## Import

| Method | Endpoint | Auth | Notes |
|---|---|---|---|
| POST | `/api/import/html` | Admin | `multipart/form-data`, one or many `.html` files. Query `dryRun=true|false`. Returns `ImportJob` with per-file `ImportLog` results. Non-dry-run creates `DRAFT` Notes. |
| GET | `/api/import/jobs` | Admin | List past import jobs. |
| GET | `/api/import/jobs/:id` | Admin | Full log detail for one job. |

## Settings

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/settings` | Admin |
| PATCH | `/api/settings` | Admin |

## Standard Error Shape

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "title": "Required" } } }
```

Codes used: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).
