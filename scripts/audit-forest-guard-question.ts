import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Quiz } from "../server/models/Quiz";

async function main() {
  await connectToDatabase();

  const quizId = "6aa5a0ad0faa12b08394a680";
  const questionId = "6aa5a0ae0faa12b08394a686";

  const quiz = await Quiz.findById(quizId).lean();
  console.log("=== QUIZ RECORD ===");
  if (quiz) {
    console.log(`Title: ${quiz.title}`);
    console.log(`Slug: ${quiz.slug}`);
    console.log(`Status: ${quiz.status}`);
  } else {
    console.log("Quiz not found by ID, searching by other means...");
  }

  const question = await QuizQuestion.findById(questionId).lean();
  console.log("\n=== QUESTION RECORD ===");
  if (question) {
    console.log(`Question ID: ${question._id}`);
    console.log(`Order: ${question.order}`);
    console.log(`Question Text: ${question.questionText}`);
    console.log(`Options: ${JSON.stringify(question.options, null, 2)}`);
    console.log(`correctOptionIndex: ${question.correctOptionIndex}`);
    console.log(`Explanation: ${question.explanation}`);
    console.log(`seoStatus: ${(question as any).seoStatus}`);
    console.log(`isAnswerVerified: ${(question as any).isAnswerVerified}`);
  } else {
    console.log("Question not found by ID.");
  }

  process.exit(0);
}

main().catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
