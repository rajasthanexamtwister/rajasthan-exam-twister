---
name: pdf-quiz-batch
description: Extracts quiz questions from user-provided PDF dumps/screenshots, maps the green checkmark to correctOptionIndex, appends to local topic JSON seed, and handles DB seeding only on explicit confirmation.
---

# PDF Quiz Batch Ingestion Workflow ("Make JSON")

This skill activates whenever the user provides a quiz batch (PDF or images) and says "make json", "json banao", or provides the next batch of questions for a topic.

## Core Rules:
1. **Green Checkmark / Box = Correct Option (`correctOptionIndex: 0..3`).**
2. **Red Cross / Box = Incorrect selection by student (never use as answer).**
3. **No intermediate Markdown.** Convert visual PDF directly to JSON.
4. **Single Consolidated Topic JSON:** Store under `question-bank/seeds/<subject>-<topic-slug>.json`.
5. **Local Only:** Never write to MongoDB during batch collection. Keep everything in local JSON.
6. **DB Seeding:** Only run `npx tsx scripts/seed-topic-batch.ts --apply` when user explicitly says "Save in DB" / "Seed".
7. **No inline terminal scripts:** Always execute via `.ts` script files.
8. **DB Entity is Single Topic Quiz (NO batches in DB):** Batches are strictly an ingestion/input mechanism. In MongoDB, there is ONLY ONE `Quiz` per topic (`title: <topic.title>`, `slug: <topic.slug>`). All questions across all batches are merged sequentially into this single Quiz (`order: 1..N`). Never create separate batch/quiz records in MongoDB.
