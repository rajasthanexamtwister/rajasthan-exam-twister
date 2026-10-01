# Content Operations & Automation Architecture
## Rajasthan Exam Twister (`https://rajasthanexamtwister.in`)

---

## 1. System Overview & Google Antigravity Workflow

Rajasthan Exam Twister provides a production-grade content operations platform tailored for Rajasthan competitive examinations (RAS, REET, RSMSSB, RPSC, CET, Police SI/Constable, Patwar).

### The Autonomous Content Generation Seam
- **Google Antigravity Engine:** Acts as the AI research, web browsing, fact-checking, and editorial drafting environment used by the administrator on free days.
- **Website CMS:** Functions as the authoritative storage, validation, taxonomy, draft queue, review portal, scheduling, sitemap, AEO/SEO rendering, and publishing engine.
- **Zero External AI API Dependencies:** The website does **NOT** require or use Gemini API, OpenAI API, or external AI API keys (`BLOG_ENGINE_URL` / `BLOG_ENGINE_API_KEY` are not used).

```
   ┌─────────────────────────────────────────────────────────────────┐
   │             GOOGLE ANTIGRAVITY RESEARCH WORKSPACE                │
   │                                                                 │
   │  1. Topic Discovery (Syllabus, Gaps, Official Notifications)    │
   │  2. Tier-1 Source Research (Raj Gov, RPSC, RSSB, RBSE)          │
   │  3. Multi-Claim Fact Verification & Cross-Checking              │
   │  4. AEO Direct Answer Formulation & Hindi Editorial Drafting    │
   │  5. FAQ & Verified MCQ Synthesis (3-10 questions)               │
   │  6. Valid Internal Link Mapping (Existing Notes/Quizzes/Blogs)  │
   │  7. Editorial QA Evaluation & Scorecard Validation              │
   └───────────────────────────────┬─────────────────────────────────┘
                                   │
                                   │ Authenticated CMS Draft Ingestion
                                   ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                    WEBSITE CMS OPERATIONS                       │
   │                                                                 │
   │  - Strict Zod Schema & Security Sanitization (No XSS, Safe DOM) │
   │  - Blog Draft Creation (Status: DRAFT)                          │
   │  - Research Audit Persistence (BlogResearch Collection)         │
   │  - Content Queue Indexing (BlogAutomationJob Collection)        │
   │  - Admin Human Review & Approval Portal (/admin/blog-automation)│
   │  - Intelligent Batch Scheduling (Staggered slots)               │
   │  - 15-Point Pre-Publish Validation (Current Affairs Freshness)  │
   │  - Idempotent Cron Publisher Worker (/api/cron/blog-publisher)  │
   │  - Public Rendering & Sitemaps (https://rajasthanexamtwister.in)│
   └─────────────────────────────────────────────────────────────────┘
```

---

## 2. Research Hierarchy & Fact Verification

All research conforms to strict authoritative tiers:
- **Tier 1 (Official Government):** Government of Rajasthan portals (`rajasthan.gov.in`), RPSC (`rpsc.rajasthan.gov.in`), RSSB (`rssb.rajasthan.gov.in`), RBSE Board Textbooks, Rajasthan Police, Department Notifications, Gazettes.
- **Tier 2 (Recognized Educational Reference):** Rajasthan Hindi Granth Academy, NCERT, authentic state gazetteers.
- **Tier 3 (General Web Sources):** Supplementary references only; cannot override Tier 1/2 facts.

### Claim Status Classification
- `VERIFIED`: Backed by Tier-1/Tier-2 documentation.
- `SUPPORTED`: Consistent with standard historical/geographical literature.
- `UNCERTAIN`: Conflicting dates or unverified numbers; flagged in QA.
- `CONFLICTING`: Major discrepancy between sources. Requires human editorial resolution before publication.

---

## 3. SEO & AEO (Answer Engine Optimization) Architecture

### 3.1 AEO Structure
1. **Direct Answer Block:** Every article begins with a concise, factual answer to the core user search query.
2. **Question Headings:** Uses natural student query headings (`H2: राजस्थान के प्रमुख लोक नृत्य कौन-कौन से हैं?`).
3. **Structured Entity Tables & Fact Lists:** Enables search engine extractors and AI answer engines to parse exact dates, districts, numbers, and definitions without ambiguity.
4. **Verified FAQs:** 3–6 real student queries with concise answers.
5. **Exam-focused MCQs:** 3–10 practice questions with options, correct answers, and authoritative explanations.

### 3.2 Single-H1 Discipline & HTML Sanitization
- Exactly one `H1` per page (the article title).
- Any `H1` tags inside generated content body are automatically demoted to `H2`.
- Strict HTML sanitization removes `<script>`, `javascript:`, unsafe `<iframe>`, and malicious event handlers.

---

## 4. Internal Link Knowledge Graph

Links connect related resources within the platform without broken references:
- **Blog** → Related **Note** (Deep revision handbook)
- **Note** → Interactive **Quiz** (Self-assessment)
- **Quiz** → **Weak Topic / Note** (Targeted remediation)

---

## 5. Domain Migration & Centralized URL Resolution

The canonical production domain is configured as:
```
https://rajasthanexamtwister.in
```

### Centralized Resolution (`server/lib/seo.ts`)
```ts
export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://rajasthanexamtwister.in";
  return url.replace(/\/$/, "");
}
```

- **Canonical URLs:** `https://rajasthanexamtwister.in/blogs/<slug>`
- **Sitemap (`app/sitemap.ts`):** Only queries `status: "PUBLISHED"`; draft and scheduled automation content are 100% excluded.
- **Robots (`app/robots.ts`):** Allows public pages, protects `/admin/` and `/api/`.
- **JSON-LD Structured Data:** Emits `Article`, `BreadcrumbList`, `WebSite`, `Organization` referencing `https://rajasthanexamtwister.in`.

---

## 6. Content Queue & Scheduling Workflow

### Status Invariants
- `Blog.status`: `DRAFT` | `PUBLISHED` | `ARCHIVED`
- `BlogAutomationJob.scheduleStatus`: `UNSCHEDULED` | `QUEUED` | `SCHEDULED` | `PROCESSING` | `PUBLISHED` | `CANCELLED` | `HOLD` | `FAILED`
- `BlogAutomationJob.qaStatus`: `PENDING` | `IN_PROGRESS` | `PASSED` | `FAILED`

### Human Approval in v1
`REVIEW_REQUIRED = true`. The publisher cron will **never** publish an article unless an administrator has explicitly approved it (`adminApproved: true`).

### Current Affairs & Time-Sensitive Safeguards
For `CURRENT_AFFAIRS` and `EXAM_UPDATES`, if `lastVerifiedAt` is older than 24 hours prior to scheduled release, the scheduler automatically transitions the item to `scheduleStatus: "HOLD"` with `errorCode: "STALE_CURRENT_AFFAIRS"` until fresh verification is confirmed.

---

## 7. Scheduler & Publisher Cron

Endpoint: `/api/cron/blog-publisher` (Protected by `Authorization: Bearer <CRON_SECRET>`)

1. **Find Due Jobs:** `scheduledAt <= now` and `scheduleStatus = "SCHEDULED"`.
2. **Atomic Lock:** Update status to `PROCESSING` to prevent duplicate concurrent publishing.
3. **Run 15-Point Pre-Publish Validation:**
   - Blog exists in database and is `DRAFT`.
   - QA score is passed (>= 70).
   - Non-empty sanitized content.
   - Zero unresolved conflicting claims.
   - Admin approval confirmed (`adminApproved: true`).
   - Current affairs freshness verified.
4. **Publish:** Calls `BlogService.publishBlog(id)` and updates job to `PUBLISHED`.
