# Rule: PDF Quiz Batch Ingestion Workflow ("Make JSON")

## Purpose & Scope
This rule establishes the exact protocol for extracting questions from user-provided PDF quiz dumps or screenshots (e.g. RajasthanGyan test results) and storing them directly into structured local JSON seed files.

Whenever the user provides a quiz batch (PDF or images) and says **"make json"**, **"json banao"**, or provides the next batch of a topic, follow this exact workflow.

---

## 1. Visual Color Semantics (Crucial)
* **GREEN Box / Green Checkmark (`✔`):** This is the **100% authoritative correct answer**. Map this option directly to `correctOptionIndex` (`0` for A, `1` for B, `2` for C, `3` for D).
* **RED Box / Red Cross (`✖`):** This is a **WRONG answer** that was clicked by the student/taker. **Never** treat the red option as the correct answer.
* **Neutral Gray Boxes:** Distractors / unselected options.
* **Top Status Line (`सही उत्तर` / `गलत उत्तर`):** This is only the test-taker's score indicator on that question; it does NOT tell which option letter was correct. Always inspect the **GREEN option**.

---

## 2. Topic-Level Single JSON File Architecture
* Do NOT create scattered individual files. All batches for a topic belong in **one consolidated master JSON file**:
  ```
  question-bank/seeds/<subject>-<topic-slug>.json
  ```
  *Example:* `question-bank/seeds/rajasthan-history-ekikaran.json`
* Schema Structure:
  ```json
  {
    "topic": {
      "title": "राजस्थान का एकीकरण",
      "subject": "राजस्थान का इतिहास",
      "slug": "rajasthan-ka-ekikaran",
      "description": "..."
    },
    "batches": [
      {
        "batchName": "Quiz 1",
        "questionCount": 30,
        "questions": [ ... ]
      },
      {
        "batchName": "Quiz 2",
        "questionCount": 30,
        "questions": [ ... ]
      }
    ]
  }
  ```

---

## 3. Direct JSON - No Intermediate Markdown
* Do NOT create or convert through intermediate Markdown files (`.md`).
* Markdown plain-text loses the green checkmark visual data.
* Extract directly from the visual PDF pages into the structured JSON object.

---

## 4. Question Object Specification
Each question in `questions` must adhere strictly to:
```json
{
  "order": 1,
  "questionText": "Clean question text",
  "examTag": "Optional (e.g. 'RPSC LDC 2011 Paper I')",
  "options": [
    "Option A text",
    "Option B text",
    "Option C text",
    "Option D text"
  ],
  "correctOptionIndex": 3,
  "explanation": "Explanation text or empty string if none provided"
}
```
* Rules:
  - `options` array must have exactly 4 items (or 5 if standard 5-option exam).
  - `correctOptionIndex` must be an integer (`0` to `options.length - 1`).
  - No HTML tags or UI buttons inside `questionText` or `options`.

---

## 5. Strict Local-Only Execution (NO Database Writes)
* When the user gives batches and says **"make json"**:
  1. Extract questions from PDF.
  2. Append/update the batch in the local JSON file.
  3. Validate the JSON file using `scripts/verify-topic-json.ts`.
  4. Report batch summary to the user (e.g., "Batch Quiz 2 added. Total 60 questions now ready in local JSON.").
  5. **DO NOT MODIFY MONGODB.** Zero database writes occur during batch collection.

---

## 6. Final Database Seeding (Only on Explicit User Command)
* Only when the user explicitly instructs: **"Save in DB"**, **"DB me save karo"**, or **"Seed in DB"** after all batches are collected:
  1. Confirm the topic name, total batch count, and total question count.
  2. Run the dedicated seed script:
     ```bash
     npx tsx scripts/seed-topic-batch.ts --apply
     ```
  3. Verify insertion in MongoDB and report the result.

---

## 7. Command Execution Standard
* **NEVER write inline scripts in terminal commands.**
* Always write or update a `.ts` script file in `scripts/` and run `npx tsx scripts/<script-name>.ts`.
