import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

async function exportSeeds() {
  await connectToDatabase();

  const configs = [
    { slug: "rajasthan-me-tyohar", file: "rajasthan-art-and-culture-tyohar.json", subject: "Rajasthan Art & Culture", topic: "राजस्थान में त्यौहार" },
    { slug: "rajasthan-ke-jile-va-sambhag", file: "rajasthan-geography-jile-sambhag.json", subject: "Rajasthan Geography", topic: "राजस्थान के जिले व संभाग" },
    { slug: "rajasthan-ki-seema", file: "rajasthan-geography-rajasthan-ki-seema.json", subject: "Rajasthan Geography", topic: "राजस्थान की सीमा" },
  ];

  for (const c of configs) {
    const quiz = await Quiz.findOne({ slug: c.slug });
    if (!quiz) continue;

    const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).lean();
    const payload = {
      subject: c.subject,
      topic: c.topic,
      slug: c.slug,
      status: quiz.status,
      totalQuestions: questions.length,
      lastVerifiedAt: new Date().toISOString(),
      questions: questions.map((q) => ({
        order: q.order,
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
      })),
    };

    const outPath = path.join(process.cwd(), "question-bank/seeds", c.file);
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
    console.log(`💾 Exported verified seed JSON: ${c.file} (${questions.length} questions)`);
  }
}

exportSeeds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
