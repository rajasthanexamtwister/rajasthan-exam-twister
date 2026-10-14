# Quiz Data Architecture, Submission State & AdSense Future-Proofing Guidelines

This rule establishes strict, non-negotiable architectural standards for the Rajasthan Exam Twister platform to prevent regression of answer-mapping bugs, final-question submission race conditions, and Google AdSense policy violations.

---

## 1. Quiz Option Indexing & Comparison Standards

### Canonical Database Storage
- **0-Based Indexing:** All quiz questions in MongoDB (`QuizQuestion`) MUST store `correctOptionIndex` as a 0-based integer:
  - `0` $\rightarrow$ Option 1 / Option A / विकल्प (अ)
  - `1` $\rightarrow$ Option 2 / Option B / विकल्प (ब)
  - `2` $\rightarrow$ Option 3 / Option C / विकल्प (स)
  - `3` $\rightarrow$ Option 4 / Option D / विकल्प (द)
- **Valid Range:** `0 <= correctOptionIndex < options.length`. Any value outside this range or `null` is invalid.

### Type-Safe Comparisons & Null Guarding
JavaScript coerces `null` to `0` when using `Number(null)`:
```ts
// ❌ DANGEROUS: Evaluates to true if optIdx is 0 and selectedOption is null!
optIdx === Number(selectedOption)

// ✅ REQUIRED: Strict null/undefined guard before numerical comparison
const isUserSelection =
  selectedOption !== null &&
  selectedOption !== undefined &&
  optIdx === Number(selectedOption);

const isCorrectAnswer =
  correctOptionIndex !== null &&
  correctOptionIndex !== undefined &&
  optIdx === Number(correctOptionIndex);
```

### Parser & Converter Rule
- When parsing external questions (from markdown, word, PDF, JSON):
  - 1-based numerals (`1, 2, 3, 4`) MUST be decremented by 1 (`raw - 1`).
  - Text prefixes like `"Option 4"`, `"विकल्प 4"`, `"(4)"`, `"D."`, `"द"` MUST map to index `3`.
  - **NEVER** fall back to default `0` (Option 1) when an answer key is unrecognized. Flag the question as unverified or throw an error for manual review.

---

## 2. Quiz Submission & React State Synchronization

### Synchronous Ref Tracking
React state updates (`setAnswers`) are asynchronous. Timer closures (`setTimeout` for auto-advance) or immediate user submission will capture stale state if reading directly from React state:

1. **Always maintain `answersRef.current`:**
   ```ts
   // In handleSelectOption:
   answersRef.current[questionId] = optionIndex;
   setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
   ```
2. **Build submission payload from `answersRef.current`:**
   ```ts
   const answersPayload = questions.map(q => ({
     questionId: q.id,
     selectedOptionIndex: answersRef.current[q.id] ?? null,
   }));
   ```
3. **Use Callback Refs for Scheduled Timers:**
   Auto-advance timers MUST reference `submitAttemptRef.current()` rather than directly capturing `submitAttempt` from an earlier render cycle.

---

## 3. Database Safety & Migration Protocol

1. **Dry-Run by Default:** Any data migration or repair script must default to `--dry-run` and require an explicit `--apply` flag.
2. **Mandatory Backups:** Pre-migration JSON snapshots must be written to `question-bank/backups/` before performing any database updates.
3. **Draft Content Isolation:** Never publish `DRAFT` questions, notes, or blogs without explicit administrative approval.
4. **Idempotency & Logging:** All migration scripts must log the question ID, old value, new value, and explanation rationale.

---

## 4. Google AdSense & SEO Compliance Standards

1. **Crawler Accessibility:**
   - `app/robots.ts` must allow `Mediapartners-Google` and `AdsBot-Google` across `/` while keeping `/admin/` restricted.
   - `public/ads.txt` must always match `google.com, pub-8986858563387447, DIRECT, f08c47fec0942fa0`.
2. **Sitemap Resilience:**
   - Any database connection inside `app/sitemap.ts` MUST be wrapped in a `Promise.race` timeout (max 2.5–3s) so SSR/build never blocks when DB is slow.
   - Essential static routes (`/`, `/quizzes`, `/notes`, `/blogs`, `/test-series`, `/leaderboard`, `/categories`, `/about`, `/contact`, `/privacy-policy`, `/terms`, `/disclaimer`) must always be present.
3. **Ad Placement Integrity:**
   - Every ad placement MUST have a clear `"Sponsored"` or `"Recommended"` label.
   - Ads must have container bounds (`minHeight`) to eliminate Cumulative Layout Shift (CLS).
   - **NO ADS** in active test solving screens (`attempt/page.tsx`) to avoid accidental clicks and policy strikes.
4. **Legal & Transparency Links:**
   - All public pages must retain the footer containing About, Contact, Privacy Policy (with Google Consent Mode v2 and Cookie Settings button), Terms, and Disclaimer.
