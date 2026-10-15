import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Category } from "../server/models/Category";

async function main() {
  await connectToDatabase();

  if (!Category) console.log("Category loaded");

  const quiz = await Quiz.findOne({ slug: "rajasthan-ka-ekikaran" }).lean();
  if (!quiz) {
    console.error("Quiz 'rajasthan-ka-ekikaran' not found!");
    process.exit(1);
  }

  console.log(`Found quiz: ${quiz.title} (ID: ${quiz._id})`);

  // Query questions for this quiz having meaningful explanations
  const questions = await QuizQuestion.find({
    quizId: quiz._id,
    explanation: { $exists: true, $ne: "" },
  })
    .sort({ order: 1 })
    .lean()
    .exec();

  console.log(`Found ${questions.length} questions with explanations in 'rajasthan-ka-ekikaran'.`);

  // Pick 5 diverse, high-quality, historical questions with detailed explanations
  // e.g. Matsya Sangh, Rajasthan Sangh, Joint Rajasthan, Greater Rajasthan, Sirohi/Ajmer merger
  const candidateIndices = [1, 2, 8, 14, 25]; // let's inspect questions around these orders
  const candidates = questions.slice(0, 15);

  const selected = [];
  for (const q of candidates) {
    const expl = (q.explanation || "").trim();
    if (expl.length >= 40 && q.options && q.options.length === 4) {
      selected.push(q);
      if (selected.length === 5) break;
    }
  }

  console.log("\n=== SELECTED 5 PILOT CANDIDATES ===");
  console.log(JSON.stringify(selected, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to select pilot candidates:", err);
  process.exit(1);
});
