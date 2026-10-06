import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

async function auditQuizzes() {
  await connectToDatabase();

  const quizzes = await Quiz.find({}).sort({ updatedAt: -1 }).lean();
  console.log(`\n======================================================`);
  console.log(`📊 AUDITING ALL QUIZZES IN DB (${quizzes.length} total)`);
  console.log(`======================================================\n`);

  for (const q of quizzes) {
    const qCount = await QuizQuestion.countDocuments({ quizId: q._id });
    console.log(`Quiz ID: ${q._id} | Status: ${q.status} | Questions: ${qCount} | Title: "${q.title}" (slug: ${q.slug})`);
  }
}

auditQuizzes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Audit error:", err);
    process.exit(1);
  });
