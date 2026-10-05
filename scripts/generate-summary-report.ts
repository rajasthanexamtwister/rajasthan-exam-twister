import fs from "fs";
import path from "path";

const dataPath = path.join(process.cwd(), "scripts/remaining_questions_data.json");
const questions = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

const groups: Record<string, any[]> = {};
questions.forEach((q: any) => {
  if (!groups[q.quizGroup]) groups[q.quizGroup] = [];
  groups[q.quizGroup].push(q);
});

console.log("=== REMAINING QUESTIONS VERIFICATION SUMMARY REPORT ===\n");
console.log(`Total Remaining Questions: ${questions.length}`);
console.log(`Total Target Quiz Batches: ${Object.keys(groups).length}\n`);

Object.entries(groups).forEach(([gName, qList]) => {
  const verifiedExams = qList.filter((q) => q.providedExamTag).map((q) => q.providedExamTag);
  const uniqueExams = Array.from(new Set(verifiedExams));

  console.log(`### 📚 Quiz Batch: ${gName}`);
  console.log(`- **Question Count**: ${qList.length} Questions`);
  console.log(`- **Verified Official Exam Tags (${uniqueExams.length})**: ${uniqueExams.length > 0 ? uniqueExams.join(", ") : "None (All set to null)"}`);
  console.log(`- **Sample Questions Breakdown**:`);

  qList.slice(0, 3).forEach((q, idx) => {
    console.log(`  ${idx + 1}. [Q${q.questionNumber}] ${q.questionText.slice(0, 70)}...`);
    console.log(`     - Final Answer: ${q.correctOptionLetter}) ${q.options[q.correctOptionIndex] || q.options[0]}`);
    console.log(`     - Exam/Year: ${q.providedExamTag || "null"}`);
    console.log(`     - Explanation: ${q.explanation.slice(0, 80)}...`);
  });
  console.log("\n--------------------------------------------------");
});
