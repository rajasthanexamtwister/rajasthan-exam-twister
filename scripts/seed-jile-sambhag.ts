import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { computeQuestionFingerprint } from "../server/services/question-bank-automation/parser";

async function seedJileSambhag() {
  await connectToDatabase();

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING TOPIC: राजस्थान के जिले व संभाग`);
  console.log(`======================================================`);

  const jsonPath = path.join(
    process.cwd(),
    "question-bank/seeds/rajasthan-geography-jile-sambhag.json"
  );

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ Seed JSON not found at: ${jsonPath}`);
    console.log(`Please run 'npx tsx scripts/generate-jile-sambhag-json.ts' first.`);
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const { subject, topic, slug, status, questions } = seedData;

  console.log(`📋 Target Topic Details:`);
  console.log(`   Subject: ${subject}`);
  console.log(`   Topic Title: ${topic}`);
  console.log(`   Slug: ${slug}`);
  console.log(`   Questions to Seed: ${questions.length}`);

  // 1. Collect unique exam tags
  const allExamTags: string[] = questions
    .map((q: any) => q.examTag)
    .filter((t: any): t is string => Boolean(t));
  const uniqueExamTags: string[] = Array.from(new Set(allExamTags));

  // 2. Find or Create Topic Quiz in DB
  let quiz = await Quiz.findOne({
    $or: [{ slug }, { title: topic }],
  });

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
    quiz.subject = subject;
    // Merge new exam tags
    const existingTags = new Set<string>(quiz.examTags || []);
    for (const tag of uniqueExamTags) {
      existingTags.add(tag);
    }
    quiz.examTags = Array.from(existingTags);
    await quiz.save();
  }

  // 3. Prevent duplicate questions by fingerprint comparison
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

  // 4. Insert non-duplicate questions
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
  console.log(`🎉 TOPIC SEEDING COMPLETE`);
  console.log(`======================================================`);
  console.log(`Quiz ID: ${quiz._id}`);
  console.log(`Title: ${quiz.title}`);
  console.log(`Subject: ${quiz.subject}`);
  console.log(`Status: ${quiz.status}`);
  console.log(`New Questions Seeded: ${importedCount}`);
  console.log(`Duplicates Skipped: ${duplicateCount}`);
  console.log(`Total Questions in Quiz: ${totalInQuiz}`);
  console.log(`======================================================\n`);
}

seedJileSambhag()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal Seeding Error:", err);
    process.exit(1);
  });
