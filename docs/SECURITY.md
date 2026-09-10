# SECURITY.md

## 1. Admin Authentication

- Single admin account, seeded via a script, no public signup endpoint exists anywhere in the app.
- Password hashed with `bcrypt` (cost factor 12).
- On login, issue a JWT (short-lived, e.g. 7 days) signed with `JWT_SECRET`, set as an **httpOnly**, **Secure** (production), **SameSite=Lax** cookie. Never store the JWT in `localStorage`/`sessionStorage`.
- `POST /api/auth/login` is rate-limited (e.g. 5 attempts / 15 min per IP) to blunt brute force.
- `/admin/**` routes are guarded by a layout-level check (`app/admin/layout.tsx`) that verifies the cookie server-side before rendering; API routes re-verify independently (never trust the UI guard alone).
- Logout clears the cookie server-side.

## 2. Session/Token Security

- JWT payload contains only `adminId` and `email` — no sensitive data.
- Secret (`JWT_SECRET`) is a long random value from environment variables, never committed, never logged.
- Cookie is scoped to the site's own domain, not shared subdomains unless required.

## 3. CSRF

- Because auth is a cookie + `SameSite=Lax`, cross-site POST forms can't trigger authenticated mutations from another origin under normal browser behavior. As defense in depth, all mutating API routes also check a custom header (e.g. `x-requested-with: ret-admin`) that only the admin UI's `fetch` calls set — cross-origin form posts can't set custom headers, so this closes the gap `SameSite=Lax` alone doesn't cover (top-level GET navigations).

## 4. XSS Prevention

- All user-authored and imported HTML is sanitized server-side (`sanitize-html`, strict allow-list — see `CONTENT_IMPORT.md` §3–5) **before** it is stored, not just before it is rendered. Stored sanitized HTML is rendered with React's `dangerouslySetInnerHTML` only in the single shared content-rendering component (see UI_SPEC.md §4) — never ad hoc elsewhere.
- Plain-text fields (title, excerpt, alt text, captions) are rendered as text, never as HTML.

## 5. HTML Sanitization (import-specific)

See `CONTENT_IMPORT.md`. Key rule: sanitize on the way in, treat everything from an uploaded `.html` file as hostile until proven otherwise by the allow-list.

## 6. File Upload Validation

- MIME type checked both by declared `Content-Type` and by inspecting file signature/magic bytes server-side (declared type alone is not trusted).
- Allowed: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- Max file size: images 5MB, PDFs 15MB (configurable via env, enforced both client-side for UX and server-side for real protection).
- Uploaded files are streamed to object storage (Cloudinary/ImageKit) under a generated key — never trust or reuse the original filename directly in storage paths.

## 7. Database & Injection Protection

- All DB access goes through Prisma with MongoDB. Queries are strongly typed and parameterized, preventing NoSQL injection attacks.

## 8. API Validation

- Every mutating endpoint validates its body with a `zod` schema before touching the database; invalid input never reaches a service/repository function.

## 9. Rate Limiting

- Applied to: `/api/auth/login` (brute force), `/api/import/html` (abuse/DoS via large batches), `/api/media` uploads. A simple in-memory or Redis-backed token bucket is sufficient at this scale — no need for a dedicated gateway product.

## 10. Secret Management

- `DATABASE_URL`, `JWT_SECRET`, media provider API keys live only in environment variables (`.env.local` locally, Vercel project env vars in production). `.env*` is git-ignored. No secret is ever logged, including in error messages returned to the client.

## 11. Content Security Policy (v1 baseline)

- A conservative CSP header disallowing inline `<script>` execution and restricting `img-src`/`media-src` to self + the chosen media provider's domain, as an additional layer beyond sanitization.
