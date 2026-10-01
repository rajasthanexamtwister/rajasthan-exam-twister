# Rajasthan Exam Twister — Production SEO & Content Automation Audit

**Domain:** `https://www.rajasthanexamtwister.in`  
**Date:** October 2026  
**Status:** Audit Complete — Phase 0

---

## 1. Repository Audit Summary

| Layer | Implementation | Audit Notes |
| :--- | :--- | :--- |
| **Framework** | Next.js 14.2 (App Router), TypeScript, Tailwind CSS | Modular monolith in `app/`, `server/`, `components/` |
| **Database** | MongoDB + Mongoose | Models: `Blog`, `Note`, `Quiz`, `BlogAutomationJob`, `BlogResearch`, `Category`, `Tag`, `Media`, `Admin`, `Student`, `QuizSubmission`, `Presence` |
| **Authentication** | Custom JWT (`AUTH_COOKIE_NAME`) for Admin + NextAuth (Google OAuth) for Students | Preserved. No changes to auth contracts. |
| **Media Storage** | Cloudinary / ImageKit | Managed via `server/services/media-storage.ts` |
| **SEO & Meta** | `server/lib/seo.ts`, `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/feed.xml/route.ts` | Uses `process.env.NEXT_PUBLIC_SITE_URL` |
| **AI Integration** | Google Antigravity Environment | **No external AI APIs** (`GEMINI_API_KEY`, `OPENAI_API_KEY` are explicitly prohibited). Antigravity performs research, fact verification, content generation, and QA offline. |

---

## 2. Canonical Production Domain & Environment

* **Canonical Domain:** `https://www.rajasthanexamtwister.in`
* **Primary Environment Variable:** `NEXT_PUBLIC_SITE_URL=https://www.rajasthanexamtwister.in`
* **NextAuth URL:** `NEXTAUTH_URL=https://www.rajasthanexamtwister.in`
* **Old Vercel Domain:** `rajasthanexamtwister.vercel.app` (Fallback removed from code; host-level redirect configured in `middleware.ts`).

---

## 3. SEO & Redirect Rules

1. **WWW Canonical:** All non-www traffic (`https://rajasthanexamtwister.in`) permanently redirects to `https://www.rajasthanexamtwister.in`.
2. **HTTP → HTTPS:** Insecure HTTP requests redirect to secure HTTPS.
3. **Old Vercel Domain:** `rajasthanexamtwister.vercel.app/*` redirects 301/308 to `https://www.rajasthanexamtwister.in/*` preserving exact paths.
4. **Sitemap Isolation:** `app/sitemap.ts` includes strictly `PUBLISHED` Blogs, Notes, and Quizzes. `DRAFT` and `ARCHIVED` items, as well as `/admin`, `/api`, and `/quiz-tools` routes, are excluded.
5. **Robots:** `app/robots.ts` allows public routes while explicitly disallowing `/admin/`, `/api/`, and `/quiz-tools/`.

---

## 4. Test Suite Audit

* **Unit & Integration Test Suite:** 32 test files, 179 unit tests.
* **Status:** 100% Passing.
* **Typecheck:** Zero TypeScript errors (`tsc --noEmit`).

---

## 5. Content Automation Workflow

```
Antigravity Environment
    ↓
Research & Fact Verification
    ↓
Article Generation (SEO + AEO + FAQ + MCQ)
    ↓
Editorial QA & Scoring
    ↓
Website CMS (BlogAutomationJob & Blog DRAFT)
    ↓
Admin Human Review & Approval
    ↓
Schedule & Cron Publisher (/api/cron/blog-publisher)
    ↓
www.rajasthanexamtwister.in (PUBLISHED)
```
