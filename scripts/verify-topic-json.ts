import fs from "fs";
import path from "path";

function verify() {
  const file = path.join(
    process.cwd(),
    "question-bank",
    "seeds",
    "rajasthan-history-ekikaran.json"
  );
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));

  console.log(`Topic: ${data.topic.title} (${data.topic.subject})`);
  console.log(`Batches: ${data.batches.length}`);

  let totalQuestions = 0;
  for (const b of data.batches) {
    console.log(`- Batch: ${b.batchName} (${b.questions.length} questions)`);
    totalQuestions += b.questions.length;

    b.questions.forEach((q: any, i: number) => {
      if (!q.questionText) throw new Error(`Missing questionText at ${i}`);
      if (!Array.isArray(q.options) || q.options.length !== 4)
        throw new Error(`Invalid options length at ${i}`);
      if (
        typeof q.correctOptionIndex !== "number" ||
        q.correctOptionIndex < 0 ||
        q.correctOptionIndex > 3
      ) {
        throw new Error(`Invalid correctOptionIndex at ${i}`);
      }
    });
  }

  console.log(`\nAll ${totalQuestions} questions passed strict validation! 100% clean JSON.`);
}

verify();
