import "dotenv/config";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Note } from "../server/models/Note";
import { Category } from "../server/models/Category";

async function main() {
  console.log("=== MASTER DATABASE READ-ONLY AUDIT ===");
  await connectToDatabase();

  // 1. Quizzes count and status breakdown
  const quizzes = await Quiz.find({}).lean();
  const quizStatusCounts: Record<string, number> = {};
  for (const q of quizzes) {
    quizStatusCounts[q.status] = (quizStatusCounts[q.status] || 0) + 1;
  }
  console.log(`\nTotal Quizzes in DB: ${quizzes.length}`);
  console.log("Quiz Status Breakdown:", quizStatusCounts);

  // 2. Notes count and status breakdown
  const notes = await Note.find({}).lean();
  const noteStatusCounts: Record<string, number> = {};
  for (const n of notes) {
    noteStatusCounts[n.status] = (noteStatusCounts[n.status] || 0) + 1;
  }
  console.log(`\nTotal Notes in DB: ${notes.length}`);
  console.log("Note Status Breakdown:", noteStatusCounts);

  // 3. Category health check
  const categories = await Category.find({}).lean();
  console.log(`\nTotal Categories: ${categories.length}`);
  const untitledCategories = categories.filter(c => c.slug === "untitled" || !c.slug);
  console.log(`Categories with 'untitled' or empty slug: ${untitledCategories.length}`);
  if (untitledCategories.length > 0) {
    console.log("Untitled categories:", untitledCategories.map(c => ({ id: c._id, name: c.name, slug: c.slug })));
  }

  // 4. Hindi Bhasha Quiz inspection
  const hindiQuiz = await Quiz.findOne({ slug: "hindi-bhasha" }).lean();
  if (hindiQuiz) {
    const hindiQuestions = await QuizQuestion.find({ quizId: hindiQuiz._id }).sort({ order: 1 }).lean();
    console.log(`\n'hindi-bhasha' Quiz:`);
    console.log(`  Title: ${hindiQuiz.title}`);
    console.log(`  Quiz Status: ${hindiQuiz.status}`);
    console.log(`  Questions Count in DB: ${hindiQuestions.length}`);
    const draftCount = hindiQuestions.filter(q => (q as any).seoStatus === "DRAFT" || !(q as any).seoStatus).length;
    const publishedCount = hindiQuestions.filter(q => (q as any).seoStatus === "PUBLISHED").length;
    console.log(`  seoStatus Breakdown -> DRAFT: ${draftCount}, PUBLISHED: ${publishedCount}`);

    // Check for duplicate question texts in hindi-bhasha
    const textSet = new Set<string>();
    const duplicates: string[] = [];
    for (const q of hindiQuestions) {
      if (textSet.has(q.questionText)) {
        duplicates.push(q.questionText);
      }
      textSet.add(q.questionText);
    }
    console.log(`  Duplicate Questions in hindi-bhasha: ${duplicates.length === 0 ? "None (Clean)" : duplicates.length}`);
  } else {
    console.log("\n'hindi-bhasha' Quiz not found in DB.");
  }

  // 5. Overall Questions seoStatus & verified answer check
  const totalQuestions = await QuizQuestion.countDocuments({});
  const draftQuestions = await QuizQuestion.countDocuments({ $or: [{ seoStatus: "DRAFT" }, { seoStatus: { $exists: false } }] });
  const publishedQuestions = await QuizQuestion.countDocuments({ seoStatus: "PUBLISHED" });
  const verifiedQuestions = await QuizQuestion.countDocuments({ isAnswerVerified: true });

  console.log(`\nTotal Questions in DB: ${totalQuestions}`);
  console.log(`Questions in DRAFT: ${draftQuestions}`);
  console.log(`Questions in PUBLISHED: ${publishedQuestions}`);
  console.log(`Questions with isAnswerVerified === true: ${verifiedQuestions}`);

  // 6. Check for out-of-range correctOptionIndex
  const allQuestions = await QuizQuestion.find({}).select("options correctOptionIndex order quizId").lean();
  let invalidIndexCount = 0;
  for (const q of allQuestions) {
    const opts = q.options || [];
    if (typeof q.correctOptionIndex !== "number" || q.correctOptionIndex < 0 || q.correctOptionIndex >= opts.length) {
      invalidIndexCount++;
    }
  }
  console.log(`Questions with out-of-range correctOptionIndex: ${invalidIndexCount}`);

  process.exit(0);
}

main().catch(err => {
  console.error("Master audit script error:", err);
  process.exit(1);
});
