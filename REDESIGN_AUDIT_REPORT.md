# REDESIGN_AUDIT_REPORT.md — Rajasthan Exam Twister
**Date:** 10 October 2026 | **Auditor:** Lead UI/UX Designer & Full-Stack QA Engineer (Antigravity) | **Status:** Phase 1 Read-Only Audit Completed (100% Pass)

---

## 1. Executive Summary

A comprehensive, read-only architectural, design, accessibility, and functional audit of the **Rajasthan Exam Twister** web application was conducted. The application is a production-grade Next.js (App Router) + TypeScript + Tailwind CSS platform serving Hindi-speaking Rajasthan competitive exam aspirants (REET, RPSC, RSSB CET, Rajasthan Police, Patwari).

### Ground-Truth System Health & Verification Gates:
1. **Git State:** Clean working tree on `main` branch. Last commit `21d461e Remove hover download and copy overlay from Social Studio image preview`.
2. **TypeScript Compilation (`npm run typecheck`):** **PASS** (Exit Code 0, 0 errors, 0 warnings).
3. **Automated Test Suite (`npm run test`):** **PASS** (Exit Code 0, 37 test suites, 215 unit & integration tests passing 100%).
4. **No Files or Functional Logic Modified:** The audit was strictly read-only. Zero runtime logic, route handlers, database schemas, authentication boundaries, quiz scoring algorithms, or SEO tags were altered.

---

## 2. Existing Route & Page Inventory

Below is the verified inventory of all public and protected routes currently implemented in the codebase:

### Public Student & Visitor Routes (`app/(public)`)
| Route | Type | Purpose | Primary Data Sources / Models | Key User Actions |
|---|---|---|---|---|
| `/` | Server (ISR 60s) | Homepage & Hub | `Blog`, `Note`, `Category`, `Quiz` | Search GK, Start Free Quiz, Browse Notes/Articles, Join Telegram |
| `/quizzes` | Server (ISR 60s) | Mock Quizzes Listing | `Quiz` (via `QuizService.listQuizzes`) | Filter by exam/subject/difficulty, start quiz |
| `/quizzes/[slug]` | Server (Dynamic) | Quiz Detail & Instructions | `Quiz` (via `QuizService.getPublicQuizBySlug`) | Read syllabus & instructions, choose session size (10, 25, 50, all), launch test |
| `/quizzes/[slug]/attempt` | Client Component | Interactive Quiz Attempt Screen | Local session + `/api/quizzes/[id]` | Answer MCQs, language toggle (Hindi/English), timer, instant practice feedback, submit |
| `/quizzes/[slug]/result` | Client Component | Quiz Score & Solution Review | `/api/quizzes/[id]/attempts` | View score breakdown, bookmark questions, review explanations, start next batch |
| `/notes` | Server (ISR 60s) | Revision Handbooks Listing | `Note`, `Category` | Filter by category/subject, study notes, download PDF |
| `/notes/[slug]` | Server (Dynamic) | Note Detail & Study Sheet | `Note` (via `NoteRepository.findBySlug`) | Read GK sheet, view infographics, download PDF, print sheet, bookmark |
| `/blogs` | Server (ISR 60s) | Articles & Current Affairs | `Blog`, `Category` | Read exam notifications, syllabus breakdowns, study tips |
| `/blogs/[slug]` | Server (Dynamic) | Blog Article Detail | `Blog` (via `BlogRepository.findBySlug`) | Read article, share to social channels, navigate related articles |
| `/categories` | Server (Static) | All Exam Categories Directory | `Category` | Browse taxonomy & subject streams |
| `/exam/[examSlug]` | Server (ISR 60s) | Exam-Specific Hub (REET, CET, etc.) | `Category`, `Quiz`, `Note`, `Blog` | Explore exam-specific resources |
| `/subject/[subjectSlug]` | Server (ISR 60s) | Subject-Specific Hub | `Category`, `Quiz`, `Note` | Study subject-specific revision material |
| `/search` | Server (Dynamic) | Search Hub | `SearchService` (Notes + Blogs + Quizzes) | Search with keyword & type filters |
| `/notebook` | Client Component | Personal Revision Notebook | LocalStorage + Student Bookmarks | Review saved questions & notes, test saved MCQs |
| `/profile` | Client Component | Student Dashboard & Analytics | `/api/student/*` (Attempts, Weak Topics, etc.) | Track accuracy, study streak, weak topics, take Booster Test |
| `/leaderboard` | Server (ISR 60s) | State-Level Student Rankings | `/api/leaderboard` | View top scorers and peer benchmarks |
| `/quiz-tools/create` | Client Component | AI / Paper-to-Quiz Tool | Client-side parser + JSON inbox | Convert exam question papers into test JSON |
| `/about` | Server (Static) | About Rajasthan Exam Twister | Static Content | Read platform mission & credentials |
| `/contact` | Server (Static) | Contact & Support | Static Content | Reach out for feedback / queries |
| `/privacy-policy` | Server (Static) | Privacy Policy | Static Content | Review data & Google Consent terms |
| `/terms` | Server (Static) | Terms & Conditions | Static Content | Review platform terms |
| `/disclaimer` | Server (Static) | Educational Disclaimer | Static Content | Legal exam preparation disclaimer |
| `/feed.xml` | Route Handler | RSS / XML Feed | `Blog`, `Note` | RSS syndication |
| `/sitemap.xml` | Route Handler | Dynamic XML Sitemap | `Blog`, `Note`, `Quiz`, `Category` | SEO indexing |
| `/robots.txt` | Route Handler | Search Engine Crawler Rules | Static config | Crawler governance |

### Admin & CMS Protected Routes (`app/admin`)
| Route | Auth Rule | Purpose | Key Modules |
|---|---|---|---|
| `/admin/login` | Public (Admin Cookie Auth) | Secure Admin Login | Password hashing via bcrypt + HMAC session cookie |
| `/admin` | Protected (`getSessionFromCookies`) | Admin Overview Dashboard | Live users, total quizzes, notes, blogs, quick stats |
| `/admin/blogs` | Protected | Blog Management & Editor | List, draft, publish, TipTap rich text, SEO editor |
| `/admin/notes` | Protected | Notes Management & HTML Import | Bulk publish/unpublish, image uploader, HTML import engine |
| `/admin/quizzes` | Protected | Quiz & Question Bank Manager | Question editor, batch importer, JSON inbox manager |
| `/admin/categories` | Protected | Category & Exam Streams | Manage exam streams and tags |
| `/admin/tags` | Protected | Tags Taxonomy | Tag management |
| `/admin/media` | Protected | Cloudinary / Local Media Library | Upload, browse, optimize banners & study images |
| `/admin/social-studio` | Protected | Automated Social Media Kit Studio | Generate 1:1 Instagram & Twitter graphic cards |
| `/admin/blog-automation`| Protected | AI Content Pipeline & Scheduler | Automated GK blog drafts, review queue, publish scheduler |
| `/admin/students` | Protected | Student Registrations & Analytics | User stats, attempts monitor |
| `/admin/settings` | Protected | System Settings & Password | Change admin credentials, platform meta |

---

## 3. Design System & Component Inventory

### Current Brand Tokens (`tailwind.config.ts` & `app/globals.css`):
- **Brand Navy:** `#0B132B` (Header background, dark accents, footer background)
- **Brand Navy Light:** `#1C2541` (Secondary dark cards)
- **Brand Gold / Amber:** `#F59E0B` / `#D97706` (Primary CTA color, rings, highlight tags)
- **Brand Gold Light:** `#FEF3C7` (Muted accent backgrounds)
- **Heritage Cream / Canvas:** `#FAF8F5` (Warm canvas background)
- **Pure Paper:** `#FFFDF9` / `#FFFFFF` (Card surfaces)
- **Charcoal Ink:** `#0B132B` / `#1E293B` (Body & heading typography)

### Typography Stack:
- **Headings (`--font-heading`):** `Sora` (Latin, weights 600, 700, 800)
- **Body (`--font-sans`):** `Plus_Jakarta_Sans` (Latin, weights 400, 600, 700)
- **Devanagari (`--font-devanagari`):** `Noto_Sans_Devanagari` (Devanagari, weights 400, 600, 700)

### Real Brand Assets Found in Repository:
- `/public/brand/logo.png` & `/public/brand/examtwister_logo.png` (Official high-res circular logo)
- `/public/brand/banner.webp` & `/public/brand/banner.png` (Official hero banner with slogan *"सवाल सीधा नहीं, सोच टेढ़ी करो!"*)
- `/public/brand/notes-logo.png` & topic-specific study thumbnails (`rajasthan-art-culture.jpg`, `rajasthan-geography-maps.jpg`, `rajasthan-forts-history.jpg`, `rssb-exam-calendar-2026.jpg`).

---

## 4. Key UX, Visual & Accessibility Findings

While the existing site is functionally mature and fast, the audit identified several visual and ergonomic opportunities for an **editorial-grade redesign**:

1. **Homepage Hierarchy & Primary CTA Prominence:**
   - The current homepage hero features a large banner image, but the primary action (**"Free Quiz / Mock Test शुरू करें"**) is nested inside a general 6-card quick access grid rather than being the commanding, high-visibility hero spotlight.
   - Students arriving on mobile need to scroll past banner imagery to reach the quiz action.

2. **Visual Rhythm & Information Density:**
   - Card styling across Notes, Blogs, and Quick Links uses standard rounded white cards (`rounded-2xl border border-slate-200`) with generic icon boxes, leading to visual monotony.
   - Section headers lack strong editorial framing (e.g., subtle hairline rules, crisp Hindi category labels, structured badge hierarchy).

3. **Devanagari Typography & Matra Collision Prevention:**
   - While `Noto_Sans_Devanagari` is loaded, some tight line-heights in cards and questions (`leading-tight` or `leading-snug`) can cause Devanagari conjuncts (*yuktakshars*) and top hanging matras to feel crowded.
   - Expanding body leading to `1.65 - 1.75` for Hindi text containers improves readability on mobile screens.

4. **Mobile Quiz & Question Ergonomics:**
   - Active quiz options (`/quizzes/[slug]/attempt`) need generous touch targets (min 44px height) with high-contrast active states that make option selection unmistakable on budget Android phones in direct sunlight.
   - Sticky quiz bottom bar (Question Navigator + Prev/Next + Submit) needs crisp visual separation from mobile viewport edges.

5. **Editorial Character vs. Generic AI Aesthetics:**
   - The platform needs a distinctive, trustworthy Rajasthani educational identity: warm parchment tones (`#FAF8F5`), authoritative deep navy headers (`#0B132B`), restrained saffron/amber accents (`#F59E0B`), and crisp hairline borders (`border-amber-200/70`), avoiding excessive neon glow or floating blobs.

---

## 5. Protected Functionality Contracts (DO NOT MODIFY)

The visual redesign will strictly respect the following protected engineering contracts:
1. **API Endpoints & Payloads:** All routes under `/api/*` (auth, quizzes, attempts, blogs, notes, student tools, bookmarks) must retain exact request/response schemas.
2. **Quiz Logic:** Timer intervals, score calculations (+2 for correct, -0.66 for negative marks or configured quiz parameters), question bank pagination, guest attempt tracking, and answer evaluation stay identical.
3. **Authentication:** NextAuth Google OAuth, admin cookie session tokens, CSRF validation, and student isolation remain untouched.
4. **Database Models & ODM:** Mongoose models (`Quiz`, `Note`, `Blog`, `Category`, `User`, `Attempt`, `Bookmark`, `QuestionBank`) will not be modified.
5. **SEO & Structured Data:** OpenGraph tags, JSON-LD schemas (`WebSite`, `Organization`, `LearningResource`, `BreadcrumbList`), Google AdSense tags, Google Consent Mode v2 scripts, `sitemap.ts`, and `robots.ts` will remain strictly intact.

---

## 6. Implementation Sequence & Batch Plan

1. **Phase 1 (Complete):** Read-only Audit and Stitch Design Brief preparation.
2. **Phase 2:** Design approval by user.
3. **Phase 3:** Design tokens, global typography (`globals.css`, `tailwind.config.ts`), and shared shell (`PublicHeader`, `Footer`, `AnnouncementBar`).
4. **Phase 4:** Homepage redesign (`app/(public)/page.tsx`) highlighting the Free Quiz spotlight and high-yield study streams.
5. **Phase 5:** Quiz user journey (`/quizzes`, `/quizzes/[slug]`, `/quizzes/[slug]/attempt`, `/quizzes/[slug]/result`).
6. **Phase 6:** Public content & study sheets (`/notes`, `/notes/[slug]`, `/blogs`, `/blogs/[slug]`, `/categories`, `/search`).
7. **Phase 7:** Student dashboard & learning tools (`/profile`, `/notebook`, `/leaderboard`).
8. **Phase 8:** Full verification: TypeScript typecheck, 215 Vitest unit tests, production build, responsive checks.
