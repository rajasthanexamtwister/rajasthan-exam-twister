import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { computeQuestionFingerprint } from "../server/services/question-bank-automation/parser";

async function seedLdcPaper() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING RSMSSB LDC 2024 MASTER PAPER 1 TO DATABASE`);
  console.log(`======================================================`);

  const seedPath = path.join(
    process.cwd(),
    "question-bank",
    "seeds",
    "rsmssb-ldc-2024-paper-1.json"
  );

  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Seed JSON not found at: ${seedPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  const rawQuestions: any[] = data.questions || [];

  console.log(`Loaded ${rawQuestions.length} questions from seed JSON.`);

  const title = "RSMSSB LDC / Junior Assistant 2024 Official Paper 1 (Master DG28)";
  const slug = "rsmssb-ldc-junior-assistant-2024-paper-1";
  const subject = "General Knowledge, Everyday Science & Mathematics";
  const category = "rajasthan-exams";
  const targetExams = [
    "RSMSSB LDC",
    "Junior Assistant",
    "RSMSSB",
    "Clerk Grade-II",
    "Rajasthan Exams"
  ];
  const tags = [
    "LDC",
    "Junior Assistant",
    "Paper 1",
    "PYQ",
    "Previous Year Paper",
    "DG28",
    "Official Paper"
  ];
  const difficulty = "medium";
  const timeLimitSeconds = 10800; // 3 hours

  // 1. Find or create Quiz document
  let quiz = await Quiz.findOne({ slug });

  if (!quiz) {
    quiz = new Quiz({
      title,
      slug,
      subject,
      category,
      targetExams,
      tags,
      difficulty,
      attemptCount: 0,
      status: "PUBLISHED",
      timeLimitSeconds,
      defaultMarks: 1,
      defaultNegativeMarks: 0.33,
      totalQuestions: rawQuestions.length,
      publishedAt: new Date(),
    });
    await quiz.save();
    console.log(`✨ Created new Quiz: ID ${quiz._id} (slug: ${slug})`);
  } else {
    console.log(`ℹ️ Updating existing Quiz: ID ${quiz._id} (slug: ${slug})`);
    quiz.title = title;
    quiz.subject = subject;
    quiz.category = category;
    quiz.targetExams = targetExams;
    quiz.tags = tags;
    quiz.status = "PUBLISHED";
    quiz.timeLimitSeconds = timeLimitSeconds;
    quiz.totalQuestions = rawQuestions.length;
    await quiz.save();
  }

  // 2. Clear previous questions for this specific quiz to guarantee clean order 1..150
  const deletedOld = await QuizQuestion.deleteMany({ quizId: quiz._id });
  console.log(`Cleaned ${deletedOld.deletedCount} existing questions for this quiz.`);

  // 3. Insert all 150 questions sequentially
  const questionDocs = rawQuestions.map((q, idx) => {
    // For deleted question (e.g. Q82 where correctOptionIndex is -1), default to 0 for schema validity
    const safeCorrectIndex = q.correctOptionIndex >= 0 ? q.correctOptionIndex : 0;
    const fp = computeQuestionFingerprint(q.questionText, q.options);

    return {
      quizId: quiz!._id,
      order: q.order || idx + 1,
      questionText: q.questionText,
      questionTextEn: q.questionTextEn || undefined,
      options: q.options,
      optionsEn: q.optionsEn && q.optionsEn.length > 0 ? q.optionsEn : undefined,
      correctOptionIndex: safeCorrectIndex,
      explanation: q.explanation || "Official RSSB Master Answer Key.",
      topic: q.topicTag || "LDC PYQ Paper 1",
      difficulty: "medium",
      format: "MCQ",
      examTag: q.examTag || "RSMSSB LDC 2024",
      fingerprint: fp,
      status: "ACTIVE",
    };
  });

  const inserted = await QuizQuestion.insertMany(questionDocs);
  console.log(`✅ Successfully seeded all ${inserted.length} questions into MongoDB!`);

  // Verify in DB
  const finalCount = await QuizQuestion.countDocuments({ quizId: quiz._id });
  console.log(`\n🎉 VERIFICATION: Quiz "${quiz.title}" has ${finalCount} live questions in DB.`);
  console.log(`🌐 Live Quiz URL: /quizzes/${quiz.slug}`);
  console.log(`======================================================\n`);

  process.exit(0);
}

seedLdcPaper().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
