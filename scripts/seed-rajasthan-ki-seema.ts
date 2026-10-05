import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { computeQuestionFingerprint } from "../server/services/question-bank-automation/parser";

async function seedFromLocalJson() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING QUESTIONS FROM LOCAL JSON INTO MONGODB`);
  console.log(`======================================================`);

  // 1. Cleanup duplicate / untitled test quiz if present
  const duplicateQuiz = await Quiz.findOne({
    $or: [{ slug: "untitled" }, { title: "राजस्थान में रीति -रिवाज एवं प्रथाएं" }],
  });

  if (duplicateQuiz && duplicateQuiz.slug === "untitled") {
    const deletedQuestions = await QuizQuestion.deleteMany({ quizId: duplicateQuiz._id });
    await Quiz.findByIdAndDelete(duplicateQuiz._id);
    console.log(`🧹 Cleaned up duplicate 'untitled' quiz (ID: ${duplicateQuiz._id}) and removed ${deletedQuestions.deletedCount} test questions.`);
  }

  // 2. Read local seed JSON file
  const jsonPath = path.join(
    process.cwd(),
    "question-bank/seeds/rajasthan-geography-rajasthan-ki-seema.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Seed JSON file not found at: ${jsonPath}`);
    console.log(`Please run 'npx tsx scripts/generate-rajasthan-ki-seema-json.ts' first.`);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const { subject, topic, slug, status, questions } = seedData;

  console.log(`\n📋 Target Topic Details:`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Topic Title: ${topic}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Questions to Seed: ${questions.length}`);

  // 3. Find or Create Topic Quiz in DB (status: DRAFT)
  let quiz = await Quiz.findOne({
    $or: [{ slug }, { title: topic }],
  });

  const allExamTags: string[] = questions
    .map((q: any) => q.examTag)
    .filter((t: any): t is string => Boolean(t));
  const uniqueExamTags: string[] = Array.from(new Set(allExamTags));

  if (!quiz) {
    quiz = new Quiz({
      title: topic,
      slug,
      subject,
      examTags: uniqueExamTags,
      difficulty: "medium",
      attemptCount: 0,
      status: status || "DRAFT",
      defaultMarks: 1,
      defaultNegativeMarks: 0.33,
    });
    await quiz.save();
    console.log(`✨ Created new Topic Quiz in DB: ID ${quiz._id} (Status: ${quiz.status})`);
  } else {
    console.log(`ℹ️ Found existing Topic Quiz in DB: ID ${quiz._id} (Status: ${quiz.status})`);
    // Merge new exam tags
    const existingTags = new Set<string>(quiz.examTags || []);
    let changed = false;
    for (const tag of uniqueExamTags) {
      if (!existingTags.has(tag)) {
        existingTags.add(tag);
        changed = true;
      }
    }
    if (changed) {
      quiz.examTags = Array.from(existingTags);
      await quiz.save();
    }
  }

  // 4. Check for duplicates in DB
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

  // 5. Insert questions
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

  const totalInBank = existingQuestions.length + importedCount;

  console.log(`\n======================================================`);
  console.log(`🎉 SEEDING COMPLETE`);
  console.log(`======================================================`);
  console.log(`Topic Quiz ID: ${quiz._id}`);
  console.log(`Quiz Title: ${quiz.title}`);
  console.log(`Quiz Status: ${quiz.status}`);
  console.log(`New Questions Seeded: ${importedCount}`);
  console.log(`Duplicates Skipped: ${duplicateCount}`);
  console.log(`Total Questions in Topic Bank: ${totalInBank}`);
  console.log(`======================================================\n`);
}

seedFromLocalJson()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Seeding Error:", err);
    process.exit(1);
  });
