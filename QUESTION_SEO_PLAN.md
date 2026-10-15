# Architecture & Implementation Plan: SEO-Friendly Public Question Pages
**Platform:** Rajasthan Exam Twister  
**Date:** October 2026  
**Status:** PROPOSED (Awaiting User Review & Approval)

---

## 1. Executive Summary & Objective

The goal is to design and implement a crawlable, high-ranking SEO architecture for individual questions on **Rajasthan Exam Twister** (`/questions/[slug]`) without compromising the security of interactive quizzes and examination attempt APIs.

### Key Architectural Constraints:
1. **Strict Zero-Leakage Pre-Submission:** The examination attempt engine (`/api/quizzes/slug/:slug` and interactive test routes) must **never** send `correctOptionIndex`, explanations, or answer keys in pre-submission payloads or client JS bundles.
2. **Selective Editorial Publishing (No Bulk Auto-Publishing):** Only manually reviewed and verified questions with high-quality explanations and verified correct options will have public SEO pages created and added to `sitemap.xml`.
3. **Dedicated Server-Side Rendered (SSR) Public Route:** Crawlable question pages (`/questions/[slug]`) will be React Server Components (RSC) containing structured data (`schema.org/QAPage`, `Question`, `Answer`, `BreadcrumbList`), server-rendered semantic HTML, and zero client-side hydration barriers for Googlebot.
4. **Answer Mapping Integrity:** Zero questions will be published until the answer mapping (verifying that `correctOptionIndex` corresponds to the authentic answer rather than student-selected red crosses from PDF dumps) is verified.

---

## 2. Current Architecture Audit

### 2.1 MongoDB Models
- **`Quiz` (`server/models/Quiz.ts`):** Contains `title`, `slug`, `subject`, `categoryId`, `examTags`, `difficulty`, `status: "DRAFT" | "PUBLISHED" | "ARCHIVED"`.
- **`QuizQuestion` (`server/models/QuizQuestion.ts`):**
  - Current fields: `quizId`, `order`, `questionText`, `questionTextEn`, `options`, `optionsEn`, `correctOptionIndex`, `explanation`, `marks`, `negativeMarks`.
  - **Audit Finding:** `QuizQuestion` currently lacks individual publishing status, custom SEO slug, review metadata, and verification timestamps. Questions only exist as sub-records of a parent `quizId`.

### 2.2 Public Quiz Routes & Attempt APIs
- **`GET /api/quizzes/slug/:slug` (`app/api/quizzes/slug/[slug]/route.ts`):**
  - Handled by `QuizService.getPublicQuizBySlug`.
  - **Audit Finding (Security PASS):** It transforms questions into `PublicQuizQuestion` stripping `correctOptionIndex` and `explanation`. Pre-submission payloads remain secure.
- **`POST /api/quizzes/:id/check-answer` (`app/api/quizzes/[id]/check-answer/route.ts`):**
  - Evaluates single question on server. Reveals explanation and correctness only on demand.
- **`POST /api/quizzes/:id/attempts` (`app/api/quizzes/[id]/attempts/route.ts`):**
  - Authoritative evaluation. Only upon full submission is the detailed scorecard with breakdown returned.

### 2.3 Sitemap & Indexation Workflow
- **`app/sitemap.ts`:**
  - Queries `Blog`, `Note`, `Quiz`, and `TestSeries` where `status: "PUBLISHED"`.
  - **Audit Finding:** No individual question URLs are currently generated or indexed.
- **`app/robots.ts`:**
  - Allows public crawling of standard routes; disallows `/admin/`, `/api/`, `/profile/`.

---

## 3. Proposed Public Question Page Architecture

### 3.1 Model Enhancements: `QuizQuestion`
We will add explicit SEO and editorial fields to `server/models/QuizQuestion.ts`:

```typescript
export interface IQuizQuestion extends Document {
  // Existing fields
  quizId: mongoose.Types.ObjectId;
  order: number;
  questionText: string;
  questionTextEn?: string;
  options: string[];
  optionsEn?: string[];
  correctOptionIndex: number;
  explanation?: string;
  marks?: number;
  negativeMarks?: number;

  // New SEO & Editorial Publishing Fields
  seoStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED"; // Default: "DRAFT"
  seoSlug?: string;                               // Unique lowercase slug, e.g. "rajasthan-sangh-pradhan-mantri-1948"
  seoTitle?: string;                              // Custom title tag override
  seoDescription?: string;                        // Meta description override
  isAnswerVerified: boolean;                      // Verification flag confirming answer mapping
  reviewedAt?: Date;                             // Timestamp of editorial review
  reviewedBy?: string;                           // Editorial reviewer identifier
  examSourceYear?: string;                       // e.g. "RSMSSB Patwar 2021", "RPSC RAS 2023"
}
```

#### New Indexes:
- Compound sparse index: `{ seoSlug: 1 }` (unique, sparse)
- Filter index: `{ seoStatus: 1, isAnswerVerified: 1, updatedAt: -1 }`

---

### 3.2 URL Structure & Routing
- **Public URL Pattern:**
  `https://www.rajasthanexamtwister.in/questions/[seoSlug]`
- **Next.js Route:**
  `app/(public)/questions/[slug]/page.tsx` (React Server Component)
- **Isolation Guarantee:**
  This route is completely decoupled from the quiz attempt engine. If a question is requested with `seoStatus !== "PUBLISHED"` or `isAnswerVerified !== true`, it returns an immediate HTTP `404 Not Found`.

---

### 3.3 Page Content & UX Structure

1. **Breadcrumbs:**
   `Home > Rajasthan GK Quizzes > [Topic Title] > Question #[Order]`
2. **Question Card:**
   - Exam Tag Badges (e.g., `RSMSSB`, `RPSC`, `Rajasthan GK`, `इतिहास`)
   - Question text in Hindi (with bilingual toggle if `questionTextEn` exists)
   - 4 Options (A, B, C, D) clearly styled with clean typography
3. **Verified Answer & Explanation Section:**
   - Authentic correct answer highlighted with verified green badge (`✓ सही उत्तर: [विकल्प]`)
   - In-depth authentic explanation block (`व्याख्या एवं महत्वपूर्ण तथ्य`)
   - Related key facts for quick revision
4. **Interactive Practice Call-to-Action (Bridge to Quiz):**
   - High-contrast banner: *"इस टॉपिक के सभी प्रश्न टेस्ट फॉर्मैट में हल करें"*
   - Direct button linking to `/quizzes/[quizSlug]?part=1` to take the full topic quiz or test series.
5. **Related Question Links:**
   - 4-5 related questions from the same topic or exam tag for internal linking equity.

---

### 3.4 Search Engine Optimization (SEO) & Structured Data

#### A. Meta Tags
- **Title:** `[Question Text (first 60 chars)] | Rajasthan GK MCQ & Answer`
- **Meta Description:** `[Question Text]? Check verified answer, detailed Hindi explanation, and related facts for Rajasthan competitive exams (RPSC, RSMSSB).`
- **Canonical URL:** `https://www.rajasthanexamtwister.in/questions/[seoSlug]`
- **OpenGraph & Twitter Card:** `summary_large_image` with brand identity and topic tags.

#### B. JSON-LD Structured Data
Dual structured data implementation:
1. **`schema.org/QAPage`:**
   ```json
   {
     "@context": "https://schema.org",
     "@type": "QAPage",
     "mainEntity": {
       "@type": "Question",
       "name": "[Question Text]",
       "text": "[Question Text]",
       "answerCount": 1,
       "acceptedAnswer": {
         "@type": "Answer",
         "text": "[Correct Option Text] - [Detailed Explanation]",
         "upvoteCount": 24
       },
       "suggestedAnswer": [
         { "@type": "Answer", "text": "[Option A]" },
         { "@type": "Answer", "text": "[Option B]" },
         { "@type": "Answer", "text": "[Option C]" },
         { "@type": "Answer", "text": "[Option D]" }
       ]
     }
   }
   ```
2. **`BreadcrumbList`:** Structured hierarchy linking Googlebot back to category and topic quiz pages.

---

### 3.5 Sitemap Integration (`app/sitemap.ts`)
Only eligible questions will be added to the sitemap:

```typescript
// Query ONLY manually reviewed & published questions
const publishedQuestions = await QuizQuestion.find({
  seoStatus: "PUBLISHED",
  isAnswerVerified: true,
  seoSlug: { $exists: true, $ne: "" },
  explanation: { $exists: true, $ne: "" }, // Exclude thin questions without explanation
})
  .select("seoSlug updatedAt")
  .lean();

const questionRoutes = publishedQuestions.map((q) => ({
  url: `${siteUrl}/questions/${q.seoSlug}`,
  lastModified: q.updatedAt || new Date(),
  changeFrequency: "monthly",
  priority: 0.7,
}));
```

---

## 4. Security & Isolation Matrix

| Capability / API | Pre-Submission Attempt API (`/api/quizzes/slug/:slug`) | Live Interactive Test (`/quizzes/:slug/attempt`) | Public Question SEO Page (`/questions/:slug`) |
| :--- | :--- | :--- | :--- |
| **`correctOptionIndex`** | ❌ **STRICTLY STRIPPED** | ❌ Stripped (evaluated on server via `check-answer`) | ✅ Displayed (Only for published SEO records) |
| **`explanation`** | ❌ **STRICTLY STRIPPED** | ❌ Stripped (revealed only upon answer check/submission) | ✅ Displayed (Verified editorial explanation) |
| **Authentication Required** | ❌ Public (Guest/Student) | ❌ Public / Session optional | ❌ Public & Crawlable by Googlebot |
| **Crawlable by Search Engines**| ❌ No (API endpoint & `noindex` attempt state) | ❌ Disallowed/excluded from sitemap | ✅ **YES** (Indexable with canonical URL) |
| **Data Source** | `QuizRepository` + `QuizQuestionRepository` | In-memory student attempt session | `QuestionSeoRepository` (filter: `seoStatus == 'PUBLISHED'`) |

---

## 5. Verification of Answer-Mapping Bug

### Background
During PDF ingestion, student dumps contain:
- **Red crosses / boxes:** The wrong option chosen by the candidate in the test.
- **Green checkmarks / boxes:** The official correct answer.

### Safety Guarantee
1. **No Bulk Publishing:** Existing 285 questions in `rajasthan-ka-ekikaran` and all other question banks remain in `seoStatus: "DRAFT"` by default.
2. **Double-Verification Tooling:**
   We will provide an editorial review command/script (`scripts/review-question-seo.ts`) where each question's `correctOptionIndex` and `explanation` are audited against authentic exam keys before setting `seoStatus: "PUBLISHED"`.
3. **Thin Content Filter:**
   Any question with an empty explanation (`explanation == ""`) will be prohibited from being set to `"PUBLISHED"`.

---

## 6. Testing Strategy

1. **Security & Leakage Tests (`tests/unit/question-seo-security.test.ts`):**
   - Verify that `/api/quizzes/slug/:slug` never includes `correctOptionIndex` or `explanation` in its JSON response.
   - Verify that client bundles for `/quizzes/[slug]/attempt` do not contain embedded answer keys.
2. **Isolation Tests (`tests/unit/question-seo-isolation.test.ts`):**
   - Verify that a question with `seoStatus: "DRAFT"` returns `404` on `/questions/[slug]`.
   - Verify that a question with `isAnswerVerified: false` returns `404`.
   - Verify that a question with `seoStatus: "PUBLISHED"` and `isAnswerVerified: true` renders HTTP `200` with complete SSR HTML.
3. **Sitemap Inclusion Test (`tests/unit/question-sitemap.test.ts`):**
   - Verify that only `seoStatus: "PUBLISHED"` questions are included in `sitemap.xml`.
   - Verify drafts, unpublished, or thin records are omitted.
4. **Structured Data Validation Test:**
   - Validate that `schema.org/QAPage` output contains valid `Question` and `AcceptedAnswer` structures.

---

## 7. Immediate Issues Resolved (Hotfixes)

While preparing this plan, two immediate blocking issues identified by the user were diagnosed and corrected:
1. **500 Internal Server Error on Quiz Attempt (`/api/quizzes/slug/rajasthan-ka-ekikaran?limit=20&part=1`):**
   - *Cause:* `MissingSchemaError: Schema hasn't been registered for model "Category"` occurred in `QuizRepository.findBySlug` during `.populate("categoryId")`.
   - *Fix:* Explicitly imported and registered `Category` in [`server/repositories/quiz.ts`](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/server/repositories/quiz.ts) and [`server/models/Quiz.ts`](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/server/models/Quiz.ts). API now returns 200 OK with all questions.
2. **Content Security Policy Violation on Google Conversion Measurement:**
   - *Cause:* GTM/GA4 conversion beacons to `https://www.google.com/measurement/conversion` were blocked because `https://www.google.com` and `https://www.google.co.in` were missing in `connect-src`.
   - *Fix:* Added `https://www.google.com https://www.google.co.in` directly to `connect-src` in [`next.config.mjs`](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/next.config.mjs). Verified with passing unit tests (`3/3 passed`).

---

## 8. Rollout Phases (Pending User Approval)

1. **Phase 1 (Schema & Repository):** Add optional SEO fields to `QuizQuestion` model and create `QuestionSeoRepository`.
2. **Phase 2 (Public RSC Page):** Build `app/(public)/questions/[slug]/page.tsx` with rich styling, structured data, and quiz-attempt CTA.
3. **Phase 3 (Sitemap & Verification Tool):** Update `app/sitemap.ts` to include only approved questions and build editorial verification script.
4. **Phase 4 (Automated Test Suite):** Run automated test suite to ensure 100% security isolation, sitemap accuracy, and crawler accessibility.
