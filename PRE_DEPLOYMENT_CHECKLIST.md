# Pre-Deployment Verification & Audit Checklist

**Project:** Rajasthan Exam Twister ([www.rajasthanexamtwister.in](https://www.rajasthanexamtwister.in))  
**Date:** October 14, 2026  
**Status:** Verification Completed — Standing By for User Authorization (No Code Deployed, No Production Data Changed)

---

## 1. File Inventory & Git Status Audit

### Modified Files (12 files)
1. **[app/(public)/quizzes/[slug]/attempt/page.tsx](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/app/(public)/quizzes/[slug]/attempt/page.tsx)**:
   - Synchronous `answersRef` tracking to eliminate React state closure staleness during auto-advance timers.
   - Callback refs (`submitAttemptRef`, `advanceToNextQuestionRef`) ensuring timers always reference the latest state.
   - Type-safe null guarding before numeric comparison (`optIdx === Number(currentFeedback.correctOptionIndex)`).
   - Submit modal counters calculated directly from active selections in `answersRef.current`.
2. **[app/(public)/quizzes/[slug]/result/page.tsx](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/app/(public)/quizzes/[slug]/result/page.tsx)**:
   - Type-safe comparison with explicit null checks (`q.correctOptionIndex !== null && optIdx === Number(q.correctOptionIndex)` and `q.selectedOptionIndex !== null && optIdx === Number(q.selectedOptionIndex)`), preventing `null` from falsely matching Option 1 (`Number(null) === 0`).
3. **[server/services/quiz-service.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/server/services/quiz-service.ts)**:
   - Coerces candidate choices and answer keys to numbers in `evaluateAttempt` and `checkSingleQuestionAnswer` (`Number(userSelected) === Number(q.correctOptionIndex)`), ensuring string/number consistency.
4. **[scripts/convert-question-bank.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/scripts/convert-question-bank.ts)**:
   - Standardized `resolveCorrectOptionIndex` to handle 1-based numerals (`1` $\rightarrow$ 0, `4` $\rightarrow$ 3), text prefixes (`"Option 4"`, `"विकल्प 4"`), and made `rawOptionsList` default to `[]`.
5. **[server/services/question-bank-automation/parser.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/server/services/question-bank-automation/parser.ts)**:
   - Enhanced `parseAnswerKeyToOptionIndex` with support for bullet punctuation (`D.`), parentheses (`(4)`), Devanagari numerals/letters (`अ-द`), and longest-match explanation scoring.
6. **[app/sitemap.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/app/sitemap.ts)**:
   - Added `/test-series` and `/leaderboard` to static routes.
   - Added dynamic `/test-series/[slug]` routes for published test series.
   - Added a 2.5-second `Promise.race` timeout fallback for `connectToDatabase()`.
7. **[question-bank/seeds/rajasthan-geography-rajasthan-ki-seema.json](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/question-bank/seeds/rajasthan-geography-rajasthan-ki-seema.json)**:
   - Corrected Question #126 (updated `correctOptionIndex` from `0` to `3` for "हनुमानगढ़") and Question #124 (`0` to `1`).
8. **[question-bank/seeds/rajasthan-geography-jile-sambhag.json](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/question-bank/seeds/rajasthan-geography-jile-sambhag.json)**:
   - Corrected Question #4 (`0` to `1`) and Question #79 (`2` to `1`).
9. **[tests/unit/seo-security.test.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/tests/unit/seo-security.test.ts)**:
   - Added `TestSeries` model mock for sitemap generation test.
10. **[tests/unit/blog-automation-sitemap-isolation.test.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/tests/unit/blog-automation-sitemap-isolation.test.ts)**:
    - Added `TestSeries` model mock for sitemap isolation test.
11. **[BLOG_REGISTRY.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/BLOG_REGISTRY.md)**:
    - Tracked blog registry metadata updates.
12. **[scripts/publish-todays-blogs.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/scripts/publish-todays-blogs.ts)**:
    - Automation helper adjustments.

### Added Files (7 files)
1. **[.agents/rules/quiz-data-and-adsense-futureproof.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/.agents/rules/quiz-data-and-adsense-futureproof.md)**:
   - Permanent architectural rule enforcing 0-based storage, null-guarded number comparisons, synchronous `answersRef` tracking, database backup protocols, and AdSense exam isolation.
2. **[.agents/rules/blog-featured-images.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/.agents/rules/blog-featured-images.md)**:
   - Image guidelines for blog automation.
3. **[.agents/rules/blog-publishing-and-ui-standards.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/.agents/rules/blog-publishing-and-ui-standards.md)**:
   - Publishing standards and UI constraints.
4. **[PROJECT_FIX_REPORT.md](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/PROJECT_FIX_REPORT.md)**:
   - Full audit report detailing root causes, code fixes, and test evidence.
5. **[scripts/migrate-and-verify-quiz-answers.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/scripts/migrate-and-verify-quiz-answers.ts)**:
   - Non-destructive database audit tool featuring dry-run by default, automated pre-migration JSON backups, and explanation validation.
6. **[tests/unit/quiz-evaluation-fixes.test.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/tests/unit/quiz-evaluation-fixes.test.ts)**:
   - Comprehensive 15-test unit suite covering Option 1..4 mappings, final question submissions, unanswered questions, and AdSense readiness.
7. **`public/brand/rajasthan-cet-12th-level-admit-card.jpg`**:
   - Asset for blog cover.

### Deleted Files
- **None.** (Zero files deleted).

---

## 2. Command Output Confirmations

### A. Automated Unit Tests (`npx vitest run`)
```
Test Files  38 passed (38)
Tests       230 passed (230)
Start at    10:53:17
Duration    23.45s
Result      EXIT CODE 0 (100% Pass Rate)
```
- Includes 15 new dedicated tests in `tests/unit/quiz-evaluation-fixes.test.ts`.
- Zero broken or failing test suites.

### B. TypeScript Check (`npx tsc --noEmit`)
```
Output:     Empty (No errors)
Result      EXIT CODE 0 (100% Type-Safe)
```

### C. Production Build (`npm run build`)
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (64/64)
✓ Finalizing page optimization
Result      EXIT CODE 0 (Zero build warnings/errors)
```

---

## 3. Migration Script & MongoDB Target Connection Verification

### Default Read-Only Mode
In [scripts/migrate-and-verify-quiz-answers.ts](file:///c:/Users/Chirag%20Bhoi/Desktop/maytoaug/trynew/scripts/migrate-and-verify-quiz-answers.ts):
```ts
const isApply = process.argv.includes("--apply");
console.log(`Mode: ${isApply ? "LIVE APPLY (Modifying Database)" : "DRY RUN (Read Only)"}`);
```
- When run without `--apply`, the script strictly executes read-only operations (`Quiz.find()` and `QuizQuestion.find()`).
- Database write operations (`QuizQuestion.updateOne()`) and backup file creation are guarded inside `if (isApply)`.

### Target Connection Resolution
- Connects using `connectToDatabase()` from `server/lib/mongodb.ts`.
- Resolves the connection URI in order of priority:
  1. `process.env.DATABASE_URL`
  2. `process.env.MONGODB_URI`
  3. `mongodb://localhost:27017/rajasthan_exam_twister` (local fallback)
- **Zero Secrets Printed:** The script outputs only generic connection status (`Connected to MongoDB successfully`) without echoing credentials, connection strings, or usernames.

---

## 4. Dry-Run Execution Results

The migration tool was executed in dry-run mode:
```bash
npx tsx scripts/migrate-and-verify-quiz-answers.ts
```

### Command Execution Summary
- **Scanned Quizzes:** All published and draft quizzes in the database.
- **Candidate Corrections Flagged:** 110 question items were identified where explanations explicitly designated an answer key different from the legacy stored index (e.g. Question #78 in *राजस्थान के जिले व संभाग* where explanation explicitly designates Option 4/D, but legacy stored index was Option 3).
- **Modification Status:** **0 records modified.**
- **Output Confirmation:**
  ```
  [DRY RUN COMPLETE] No records were modified. Run with '--apply' to update MongoDB.
  ```

---

## 5. Unresolved Production Database, Deployment & Live-Site Steps

Before live deployment, the following steps must be sequentially approved:

1. **Production Database Correction Authorization:**
   - Execute the migration with `--apply` to update the identified candidate records in MongoDB:
     ```bash
     npx tsx scripts/migrate-and-verify-quiz-answers.ts --apply
     ```
   - An automated pre-migration backup will be saved to `question-bank/backups/quiz-questions-backup-[timestamp].json`.
2. **Git Commit & Merge:**
   - Review and stage changes:
     ```bash
     git add -A
     git commit -m "fix(quiz): resolve answer mapping bug, final question submission state, and AdSense sitemap discoverability"
     ```
3. **Vercel Production Deployment:**
   - Deploy to Vercel production branch (`main`).
4. **Live-Site Smoke Test:**
   - Verify `https://www.rajasthanexamtwister.in/ads.txt` returns HTTP 200 with publisher account `pub-8986858563387447`.
   - Verify `https://www.rajasthanexamtwister.in/sitemap.xml` contains `/test-series` and `/leaderboard`.
5. **Google Search Console & AdSense Resubmission:**
   - Resubmit sitemap in GSC.
   - Confirm AdSense Site Status in Google AdSense Policy Center.

---

## 6. Manual Browser Verification Test Plan

Once approved to run locally (`npm run dev`) or on staging:

### Test Case 1: Option-Mapping Verification (Option 1 vs Option 4)
1. Navigate to `/quizzes/rajasthan-ki-seema` (or any topic quiz).
2. Locate Question #126 (or any question where Option 4 is the correct answer).
3. **Action:** Click **Option 4** ("हनुमानगढ़").
4. **Expected Result:**
   - Option 4 highlights in green with a checkmark badge (`bg-emerald-50 text-emerald-950 border-emerald-500`).
   - Option 1 remains unselected/muted.
   - Feedback card displays: `Correct Answer: Option D` with positive marks (+1 or +2).
5. Locate a question where Option 4 is correct and click **Option 1**.
6. **Expected Result:**
   - Option 1 highlights in red (`bg-red-50 text-red-950 border-red-500`).
   - Option 4 displays green ring and checkmark as the correct answer.
   - Feedback card displays: `Correct Answer: Option D` with negative marks.

### Test Case 2: Final Question Submission Verification
1. Navigate to any 10-question practice test or topic quiz (e.g. `/quizzes/rajasthan-ke-jile-va-sambhag`).
2. Answer questions 1 through 9.
3. Advance to the **Final Question (Question 10 of 10)**.
4. **Action:** Select an option on Question 10, then immediately click **Submit Exam** in the modal (or wait for the auto-advance timer to complete).
5. **Expected Result:**
   - Submit modal displays: `Answered: 10, Skipped: 0`.
   - Upon redirect to `/result`, Question 10 is marked **Attempted** (`isUnattempted = false`).
   - Question 10 displays the student's selected option, awarded marks, and correct option breakdown.
   - Summary statistics display `Unattempted: 0` (or matching only intentionally skipped questions).

### Test Case 3: Public Google AdSense Readiness Verification
1. Open an incognito browser window and navigate to `/`.
2. Inspect the footer: Confirm links to `/about`, `/contact`, `/privacy-policy`, `/terms`, `/disclaimer`, `/test-series`, and `/leaderboard` are live and return HTTP 200.
3. On `/privacy-policy`, click the **Cookie Preferences** button: Confirm the Google Consent Mode v2 modal opens and allows toggling Analytics/Ad preferences.
4. Navigate to `/blogs/[any-blog-slug]`: Confirm ads show the `"Sponsored"` label, adhere to container boundaries (`minHeight`), and do not block text or navigation.
5. Navigate to `/quizzes/[slug]/attempt`: Confirm the quiz test screen is **100% ad-free**.
6. Navigate to `https://www.rajasthanexamtwister.in/ads.txt`: Confirm the raw text matches `google.com, pub-8986858563387447, DIRECT, f08c47fec0942fa0`.

---

## 7. Operational Status

- **Code Deployment:** **NOT PERFORMED**
- **Production Database Changes:** **NOT APPLIED**
- **Google AdSense Review Request:** **NOT SUBMITTED**

*All items are verified and awaiting your authorization.*
