import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { computeQuestionFingerprint } from "../server/services/question-bank-automation/parser";

async function seedBciPaper2() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING BCI / SCI COMPUTER INSTRUCTOR PAPER-2`);
  console.log(`======================================================`);

  const jsonPath = path.join(
    process.cwd(),
    "question-bank/seeds/bci-sci-computer-instructor-paper-2.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Seed JSON not found at: ${jsonPath}`);
    console.log(`Please run 'npx tsx scripts/generate-bci-paper-2-json.ts' first.`);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const {
    title,
    subject,
    slug,
    examTags,
    difficulty,
    status,
    timeLimitSeconds,
    defaultMarks,
    defaultNegativeMarks,
    questions,
  } = seedData;

  console.log(`📋 Test Series Details:`);
  console.log(`   Title: ${title}`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Questions in Payload: ${questions.length}`);

  // 1. Find or create Quiz document
  let quiz = await Quiz.findOne({
    $or: [{ slug }, { title }],
  });

  if (!quiz) {
    quiz = new Quiz({
      title,
      slug,
      subject,
      examTags: examTags || [],
      difficulty: difficulty || "medium",
      attemptCount: 0,
      status: status || "DRAFT",
      timeLimitSeconds: timeLimitSeconds || 7200,
      defaultMarks: defaultMarks || 1,
      defaultNegativeMarks: defaultNegativeMarks || 0.33,
    });
    await quiz.save();
    console.log(`✨ Created new Test Series Quiz in DB: ID ${quiz._id} (Status: ${quiz.status})`);
  } else {
    console.log(`ℹ️ Found existing Quiz in DB: ID ${quiz._id} (Status: ${quiz.status})`);
    quiz.subject = subject;
    quiz.examTags = examTags || quiz.examTags;
    await quiz.save();
  }

  // 2. Prevent duplicates by checking existing questions
  const existingQuestions = await QuizQuestion.find({ quizId: quiz._id }).lean();
  const existingFingerprints = new Set(
    existingQuestions.map((q) => computeQuestionFingerprint(q.questionText, q.options))
  );

  const nonDuplicates: any[] = [];
  let duplicateCount = 0;

  for (const q of questions) {
    const fp = computeQuestionFingerprint(q.questionText, q.options);
    if (existingFingerprints.has(fp)) {
      duplicateCount++;
    } else {
      nonDuplicates.push(q);
      existingFingerprints.add(fp);
    }
  }

  // 3. Insert non-duplicate questions
  let importedCount = 0;
  if (nonDuplicates.length > 0) {
    const startOrder = existingQuestions.length;
    const docs = nonDuplicates.map((q, idx) => ({
      quizId: quiz!._id,
      order: startOrder + idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
      marks: 1,
      negativeMarks: 0.33,
    }));

    const inserted = await QuizQuestion.insertMany(docs);
    importedCount = inserted.length;
  }

  const totalInQuiz = existingQuestions.length + importedCount;

  console.log(`\n======================================================`);
  console.log(`🎉 TEST SERIES SEEDING COMPLETE`);
  console.log(`======================================================`);
  console.log(`Quiz ID: ${quiz._id}`);
  console.log(`Title: ${quiz.title}`);
  console.log(`Status: ${quiz.status}`);
  console.log(`New Questions Seeded: ${importedCount}`);
  console.log(`Duplicates Skipped: ${duplicateCount}`);
  console.log(`Total Questions in Quiz: ${totalInQuiz}`);
  console.log(`======================================================\n`);
}

seedBciPaper2()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Seeding Error:", err);
    process.exit(1);
  });
