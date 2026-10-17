---
name: pdf-quiz-batch
description: Universal quiz batch ingestion workflow. Extracts quiz questions from user-provided .docx (primary/fastest) or PDF dumps/screenshots, maps the green answer highlight (#22c55e) to correctOptionIndex, separates explanations, appends to local topic JSON seed, and handles DB seeding only on explicit confirmation.
---

# Universal Quiz Ingestion Workflow (".docx / PDF to JSON")

This skill activates whenever the user provides a quiz file (`.docx`, PDF, or images) and says "json", "make json", "json banao", or shares a question batch.

## 1. Primary Ingestion: Word File (`.docx`)
The user's official standard workflow is providing `.docx` files containing mock tests / question dumps.

### How to Execute:
1. Always run the universal parser script:
   ```powershell
   python scripts/parse-docx-quiz.py "<path-to-docx-file>"
   ```
2. The script automatically:
   - Reads `word/document.xml` in ~1-2 seconds.
   - Identifies question text, numbers, and exam source tags (e.g. `RPSC`, `RSMSSB`, `Lab Assistant`).
   - Extracts options A, B, C, D.
   - Maps Green shading (`#22c55e`, `#f0fdf4`, `#15803d`) to `correctOptionIndex: 0..3`.
   - Strictly ignores Red shading (`#ef4444`, `#fef2f2`, `#b91c1c`), which indicates student incorrect mock selections.
   - Cleanly detaches `💡 व्याख्या` from Option D into the `explanation` field.
   - Consolidates all batches and writes the seed JSON to `question-bank/seeds/<categorySlug>-<topicSlug>.json`.
   - Runs a full validation audit: checks for 4 options per question, valid 0..3 answer index, duplicate questions, and answer distribution.
3. Present the verification audit report to the user and ask for confirmation to seed into the database.

## 2. Core Project Safety Rules:
1. **Never write to MongoDB during parsing/JSON creation:** Keep everything local in `question-bank/seeds/<categorySlug>-<topicSlug>.json`.
2. **DB Seeding on Explicit Confirmation Only:** Only run the seed script when the user explicitly says "Save in DB", "Seed", or "DB me daal do":
   ```powershell
   npx tsx scripts/seed-topic-batch.ts --apply "question-bank/seeds/<categorySlug>-<topicSlug>.json"
   ```
3. **No inline terminal execution:** Always execute via `.ts` or `.py` script files.
4. **Single Topic Quiz in Database (NO Batches in DB):**
   Batches are strictly an ingestion/input mechanism. In MongoDB, there is ONLY ONE `Quiz` per topic (`slug: <topic-slug>`). All questions across all batches are merged sequentially into this single Quiz (`order: 1..N`). Never create separate batch quiz records in MongoDB.
