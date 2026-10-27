import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function seedCetPaper() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ No MongoDB URI found in environment.");
    process.exit(1);
  }

  const filePath = path.join(
    process.cwd(),
    "question-bank",
    "seeds",
    "rsmssb-cet-12th-level-2023-04-feb-shift-1.json"
  );

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING QUIZ: RSMSSB CET 2022 (12th Level) 04 Feb 2023 Shift-1`);
  console.log(`📂 Source File: ${filePath}`);
  console.log(`======================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Seed JSON not found at: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const rawQuestions = data.questions || [];
  console.log(`Loaded ${rawQuestions.length} verified questions from seed JSON.`);

  if (rawQuestions.length !== 150) {
    console.error(`❌ Expected exactly 150 questions, found: ${rawQuestions.length}`);
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB Connected successfully.");

  const db = mongoose.connection.db;
  const quizzesCollection = db.collection("quizzes");
  const questionsCollection = db.collection("quizquestions");

  const title = "RSMSSB CET 2022 (12th Level) 04 February 2023 Shift-1 Official Master Paper";
  const slug = "rsmssb-cet-12th-level-04-feb-2023-shift-1";
  const subject = "General Knowledge, Everyday Science, Math, Hindi & English";
  const category = "rajasthan-exams";
  const targetExams = [
    "RSMSSB CET 12th Level",
    "CET Senior Secondary",
    "RSMSSB",
    "Rajasthan Exams"
  ];
  const tags = [
    "CET 12th Level",
    "04 Feb 2023 Shift 1",
    "PYQ",
    "Previous Year Paper",
    "Official Paper",
    "Senior Secondary CET"
  ];
  const difficulty = "medium";
  const timeLimitSeconds = 10800; // 3 Hours

  // 1. Find or create Quiz document
  let existingQuiz = await quizzesCollection.findOne({ slug });
  let quizId;

  if (!existingQuiz) {
    const newQuiz = {
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
      defaultMarks: 2,
      defaultNegativeMarks: 0,
      totalQuestions: 150,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await quizzesCollection.insertOne(newQuiz);
    quizId = result.insertedId;
    console.log(`✨ Created new Quiz: ID ${quizId} (slug: ${slug})`);
  } else {
    quizId = existingQuiz._id;
    console.log(`ℹ️ Updating existing Quiz: ID ${quizId} (slug: ${slug})`);
    await quizzesCollection.updateOne(
      { _id: quizId },
      {
        $set: {
          title,
          subject,
          category,
          targetExams,
          tags,
          status: "PUBLISHED",
          timeLimitSeconds,
          defaultMarks: 2,
          defaultNegativeMarks: 0,
          totalQuestions: 150,
          updatedAt: new Date(),
        },
      }
    );
  }

  // 2. Clear previous questions for this specific quiz
  const deleteResult = await questionsCollection.deleteMany({ quizId: quizId });
  console.log(`Cleaned ${deleteResult.deletedCount} existing questions for this quiz.`);

  // 3. Prepare all 150 questions
  const questionDocs = rawQuestions.map((q, idx) => {
    const safeCorrectIndex = q.correctOptionIndex >= 0 ? q.correctOptionIndex : 0;
    return {
      quizId: quizId,
      order: q.order || idx + 1,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: safeCorrectIndex,
      explanation: q.explanation || "RSMSSB CET 2022 (12th Level) Official Master Answer Key.",
      topic: "CET 12th Level PYQ",
      difficulty: "medium",
      format: "MCQ",
      examTag: "RSMSSB CET 2022 (12th Level) 04 Feb 2023 Shift-1",
      seoStatus: "PUBLISHED",
      isAnswerVerified: true,
      verifiedOptionIndex: safeCorrectIndex,
      verificationSource: "RSMSSB Official Final Answer Key",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  const insertResult = await questionsCollection.insertMany(questionDocs);
  console.log(`✅ Successfully seeded all ${insertResult.insertedCount} questions into MongoDB!`);

  // 4. Verify in DB
  const finalCount = await questionsCollection.countDocuments({ quizId: quizId });
  console.log(`\n🎉 VERIFICATION: Quiz "${title}" has ${finalCount} live questions in DB.`);
  console.log(`🌐 Live Quiz URL: https://www.rajasthanexamtwister.in/quizzes/${slug}`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seedCetPaper().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
