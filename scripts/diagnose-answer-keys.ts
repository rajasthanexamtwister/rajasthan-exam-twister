import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

function normalizeDevanagari(text: string): string {
  if (!text) return "";
  let s = text.toLowerCase();
  // Normalize bindu / anusvara and nasal consonants: ं, ँ, न, ण, म
  s = s.replace(/[\u0901\u0902]/g, "न");
  // Remove punctuation, brackets, spaces, quotes
  s = s.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "");
  // Normalize common spelling variants
  s = s.replace(/बूँदी|बुन्दी/g, "बूंदी");
  s = s.replace(/सातुड़ी|सातुड़ी/g, "सातूड़ी");
  s = s.replace(/डूंगरपुर|डुंगरपुर/g, "डूंगरपुर");
  return s;
}

async function diagnose() {
  await connectToDatabase();

  const slugs = [
    "rajasthan-me-tyohar",
    "rajasthan-ke-jile-va-sambhag",
    "rajasthan-ki-seema",
    "rajasthan-me-reeti-riwaj-avam-prathayein",
  ];

  for (const slug of slugs) {
    const quiz = await Quiz.findOne({ slug });
    if (!quiz) continue;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 });
    console.log(`\n======================================================`);
    console.log(`🔍 DIAGNOSING QUIZ: "${quiz.title}" (${questions.length} Qs)`);
    console.log(`======================================================`);

    let zeroCount = 0;
    let mismatchCount = 0;

    for (const q of questions) {
      if (q.correctOptionIndex === 0) zeroCount++;

      const expNorm = normalizeDevanagari(q.explanation || "");
      const currentSelectedOpt = q.options[q.correctOptionIndex] || "";
      const currentNorm = normalizeDevanagari(currentSelectedOpt);

      // Check if any other option has a much stronger match in the explanation
      let bestOtherIdx = -1;
      let bestOtherScore = 0;

      for (let i = 0; i < q.options.length; i++) {
        const optNorm = normalizeDevanagari(q.options[i]);
        if (optNorm.length > 1 && expNorm.includes(optNorm)) {
          if (optNorm.length > bestOtherScore) {
            bestOtherScore = optNorm.length;
            bestOtherIdx = i;
          }
        }
      }

      if (bestOtherIdx !== -1 && bestOtherIdx !== q.correctOptionIndex) {
        mismatchCount++;
        console.log(`\n⚠️ Potential Mismatch Q#${q.order}:`);
        console.log(`   Question: ${q.questionText}`);
        console.log(`   Options: ${q.options.map((o, idx) => `[${String.fromCharCode(65 + idx)}] ${o}`).join(" | ")}`);
        console.log(`   Current Answer: Option ${String.fromCharCode(65 + q.correctOptionIndex)} ("${currentSelectedOpt}")`);
        console.log(`   Better Match: Option ${String.fromCharCode(65 + bestOtherIdx)} ("${q.options[bestOtherIdx]}")`);
        console.log(`   Explanation: ${q.explanation}`);
      }
    }

    console.log(`\nSummary for ${quiz.title}:`);
    console.log(`  Total Qs: ${questions.length}`);
    console.log(`  Questions with Option A (index 0): ${zeroCount} (${((zeroCount / questions.length) * 100).toFixed(1)}%)`);
    console.log(`  Flagged for potential mismatch: ${mismatchCount}`);
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
