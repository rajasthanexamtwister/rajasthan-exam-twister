# TESTING.md

## 1. Tooling

- **Unit / API tests:** Vitest (or Jest) + Supertest-style route handler testing.
- **E2E:** Playwright.
- **Type safety:** `tsc --noEmit` run in CI/before every batch completion.

## 2. Test Types

| Type | Scope |
|---|---|
| Unit | Slug generation, sanitization config, content-hash duplicate detection, validation schemas |
| API | Every endpoint in `API_SPEC.md` — happy path + key error cases |
| Integration | Import pipeline end-to-end (file in → sanitized draft out) |
| Security | Auth guard bypass attempts, malicious HTML sanitization, upload MIME/size limits |
| Auth | Login, logout, session check, rate limiting |
| Upload | Valid/invalid file types, oversized files, media reuse/delete guard |
| E2E | Full admin flows (create/edit/publish) and full public flows (browse/search/read) in a real browser |

## 3. Critical Test List (must all be green before Batch 8 sign-off)

1. Create blog (API + UI)
2. Edit blog
3. Save blog as draft
4. Publish blog
5. Delete blog (with confirmation)
6. Create note
7. Upload image (valid + invalid types)
8. Import HTML (clean file)
9. Sanitize malicious HTML (script/iframe/event-handler stripped, verified in stored content)
10. Search content (relevant results returned)
11. Admin authentication (successful login)
12. Unauthorized admin access (redirect/401 on protected routes and APIs)
13. Duplicate slug handling (auto-suffix or rejection with clear message)
14. Invalid file upload (oversized, wrong MIME) rejected with clear error
15. Mobile UI (responsive check on key pages via Playwright viewport emulation)
16. Production build (`next build` succeeds, zero type errors)

## 4. Batch-Level Testing

Each batch in `DEVELOPMENT_PLAN.md` lists its own required tests — those must pass before a batch is marked complete, per `AI_RULES.md` rule 10–12.

## 5. What's Out of Scope for v1

- Load/performance testing beyond basic Lighthouse checks (SEO.md/DEVELOPMENT_PLAN.md Batch 7).
- Visual regression testing.
- Cross-browser matrix beyond current Chrome/Safari/mobile Safari (the realistic audience's browsers).
