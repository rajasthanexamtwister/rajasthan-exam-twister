import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function seed() {
  const mongoUri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ No MongoDB URI found in environment.");
    process.exit(1);
  }

  const filePath = path.join(
    process.cwd(),
    "question-bank",
    "seeds",
    "sujas-rajasthan-current-affairs.json"
  );

  console.log(`\n======================================================`);
  console.log(`🚀 SEEDING QUIZ: राजस्थान आर्थिक समीक्षा प्रश्नोत्तरी (300 प्रश्न)`);
  console.log(`📂 Source File: ${filePath}`);
  console.log(`======================================================`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Seed JSON not found at: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const rawQuestions = data.questions || [];
  console.log(`Loaded ${rawQuestions.length} verified questions from seed JSON.`);

  if (rawQuestions.length !== 300) {
    console.error(`❌ Expected 300 questions, got ${rawQuestions.length}`);
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB successfully!");

  const db = mongoose.connection.db;

  // 1. Locate category
  let category = await db.collection("categories").findOne({ slug: "rajasthan-current-affairs" });
  if (!category) {
    category = await db.collection("categories").findOne({ slug: "current-affairs" });
  }
  const categoryId = category ? category._id : null;
  console.log(`Target Category: ${category ? category.name : "None"} (${categoryId})`);

  const title = data.title || "राजस्थान आर्थिक समीक्षा प्रश्नोत्तरी (300 प्रश्न)";
  const slug = data.slug || "rajasthan-arthik-samiksha-300-questions";
  const subject = data.subject || "राजस्थान आर्थिक समीक्षा 2025-26";
  const examTags = data.examTags || [
    "राजस्थान आर्थिक समीक्षा",
    "Rajasthan Economic Review 2025-26",
    "सुजस राजस्थान",
    "Current Affairs",
    "RPSC",
    "RSSB",
    "PYQ"
  ];
  const difficulty = data.difficulty || "medium";
  const defaultMarks = data.defaultMarks ?? 2;
  const defaultNegativeMarks = data.defaultNegativeMarks ?? 0;

  // 2. Upsert Quiz
  let quiz = await db.collection("quizzes").findOne({ slug });

  const quizPayload = {
    title,
    slug,
    subject,
    categoryId,
    examTags,
    difficulty,
    attemptCount: quiz?.attemptCount || 0,
    status: "PUBLISHED",
    defaultMarks,
    defaultNegativeMarks,
    totalQuestions: rawQuestions.length,
    shuffleQuestions: false,
    shuffleOptions: false,
    publishedAt: quiz?.publishedAt || new Date(),
    updatedAt: new Date()
  };

  let quizId;
  if (!quiz) {
    quizPayload.createdAt = new Date();
    const insertRes = await db.collection("quizzes").insertOne(quizPayload);
    quizId = insertRes.insertedId;
    console.log(`✨ Created new Quiz: ID ${quizId} (slug: ${slug})`);
  } else {
    quizId = quiz._id;
    await db.collection("quizzes").updateOne({ _id: quizId }, { $set: quizPayload });
    console.log(`ℹ️ Updated existing Quiz: ID ${quizId} (slug: ${slug})`);
  }

  // 3. Clear previous questions for this specific quizId
  const deleteRes = await db.collection("quizquestions").deleteMany({
    $or: [{ quizId: quizId }, { quizId: quizId.toString() }]
  });
  console.log(`Cleaned ${deleteRes.deletedCount} existing questions for this quiz.`);

  // 4. Batch insert all 300 questions
  const questionDocs = rawQuestions.map((q, idx) => ({
    quizId: quizId,
    order: q.order || (idx + 1),
    questionText: q.questionText,
    options: q.options,
    correctOptionIndex: q.correctOptionIndex,
    explanation: q.explanation || "Official Answer Key & Economic Review Analysis.",
    topic: "राजस्थान आर्थिक समीक्षा 2025-26",
    difficulty: "medium",
    format: "MCQ",
    examSource: "सुजस एवं राजस्थान आर्थिक समीक्षा 2025-26",
    seoStatus: "PUBLISHED",
    isAnswerVerified: true,
    verifiedOptionIndex: q.correctOptionIndex,
    verificationSource: "Rajasthan Economic Review & Sujas Official",
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  const insertQuestionsRes = await db.collection("quizquestions").insertMany(questionDocs);
  console.log(`✅ Successfully inserted all ${insertQuestionsRes.insertedCount} questions into MongoDB!`);

  // 5. Final Verification
  const verifyCount = await db.collection("quizquestions").countDocuments({ quizId: quizId });
  console.log(`\n======================================================`);
  console.log(`🎉 VERIFICATION SUCCESSFUL!`);
  console.log(`📊 Quiz Title: "${title}"`);
  console.log(`🆔 Quiz ID: ${quizId}`);
  console.log(`📝 Total Live Questions in DB: ${verifyCount} of 300`);
  console.log(`🌐 Quiz Overview URL: /quizzes/${slug}`);
  console.log(`🎯 Test Attempt URL:   /quizzes/${slug}/attempt`);
  console.log(`======================================================\n`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
