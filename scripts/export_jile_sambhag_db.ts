import "dotenv/config";
import fs from "fs";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

async function exportJileSambhag() {
  await connectToDatabase();

  const quiz = await Quiz.findOne({
    $or: [
      { slug: "rajasthan-ke-jile-va-sambhag" },
      { title: "राजस्थान के जिले व संभाग" }
    ]
  }).lean();

  if (!quiz) {
    console.error("❌ Quiz not found in DB!");
    process.exit(1);
  }

  const questions = await QuizQuestion.find({ quizId: quiz._id })
    .sort({ order: 1 })
    .lean();

  const payload = {
    title: quiz.title,
    slug: quiz.slug,
    subject: quiz.subject || "Rajasthan Geography",
    topic: quiz.title,
    totalQuestions: questions.length,
    status: quiz.status,
    questions: questions.map((q) => ({
      order: q.order,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn || undefined,
      options: q.options,
      optionsEn: q.optionsEn || undefined,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      examTag: q.examTag || ""
    }))
  };

  const outPath = "question-bank/seeds/rajasthan-ke-jile-va-sambhag-db-export.json";
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");

  console.log(
    `✅ Successfully exported ${questions.length} questions from DB for "${quiz.title}" (slug: ${quiz.slug}) to ${outPath}`
  );
  process.exit(0);
}

exportJileSambhag().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
