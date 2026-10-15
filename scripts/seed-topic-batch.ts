import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import { Category } from "../server/models/Category";
import { slugify } from "../server/lib/slugify";

async function main() {
  const isApply = process.argv.includes("--apply");
  const filePath =
    process.argv.find((arg) => arg.endsWith(".json")) ||
    path.join(process.cwd(), "question-bank", "seeds", "rajasthan-history-ekikaran.json");

  console.log(`=== TOPIC CONSOLIDATED SEED / DB INGESTION ===`);
  console.log(`Source File: ${filePath}`);
  console.log(`Mode: ${isApply ? "LIVE APPLY (Modifying MongoDB)" : "DRY RUN (Read Only)"}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Topic Title: ${data.topic.title}`);
  console.log(`Topic Slug: ${data.topic.slug}`);
  console.log(`Subject: ${data.topic.subject}`);
  console.log(`Input Batches in JSON: ${data.batches.length}`);

  // Flatten all questions across all batches in sequence
  const allQuestions: Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string;
  }> = [];

  for (const b of data.batches) {
    for (const q of b.questions) {
      allQuestions.push({
        questionText: q.questionText,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation || "",
      });
    }
  }

  console.log(`Total Consolidated Questions: ${allQuestions.length}`);

  if (!isApply) {
    console.log(`\n[DRY RUN COMPLETE] Zero database writes performed.`);
    console.log(`Run with '--apply' to seed the single consolidated Quiz into MongoDB.`);
    return;
  }

  await connectToDatabase();
  console.log("\nConnected to MongoDB.");

  // 1. Find or create Category for subject
  let category = await Category.findOne({ name: data.topic.subject });
  if (!category) {
    let catSlug = slugify(data.topic.subject);
    if (!catSlug || catSlug === "untitled") {
      if (data.topic.subject.includes("हिन्दी")) catSlug = "hindi";
      else if (data.topic.subject.includes("इतिहास")) catSlug = "rajasthan-history";
      else if (data.topic.subject.includes("भूगोल")) catSlug = "rajasthan-geography";
      else if (data.topic.subject.includes("कला") || data.topic.subject.includes("संस्कृति")) catSlug = "rajasthan-art-culture";
      else catSlug = `category-${Date.now()}`;
    }
    category = await Category.findOne({ slug: catSlug });
    if (!category) {
      category = await Category.create({
        name: data.topic.subject,
        slug: catSlug,
      });
      console.log(`Created new Category: "${data.topic.subject}" (${catSlug})`);
    }
  }
  if (category) {
    console.log(`Category: "${category.name}" (ID: ${category._id})`);
  }

  // 2. Clean up any previous fragmented batch quizzes for this topic (e.g. slug starts with `${topic.slug}-quiz-`)
  const batchSlugPattern = new RegExp(`^${data.topic.slug}-quiz-`, "i");
  const oldBatchQuizzes = await Quiz.find({ slug: batchSlugPattern });
  if (oldBatchQuizzes.length > 0) {
    console.log(`\nFound ${oldBatchQuizzes.length} fragmented batch quiz(zes) to remove:`);
    for (const obq of oldBatchQuizzes) {
      const qCount = await QuizQuestion.countDocuments({ quizId: obq._id });
      await QuizQuestion.deleteMany({ quizId: obq._id });
      await Quiz.deleteOne({ _id: obq._id });
      console.log(` - Deleted old batch quiz "${obq.title}" (${obq.slug}) & removed its ${qCount} questions.`);
    }
  }

  // 3. Find or create the ONE SINGLE Quiz for the topic
  const quizTitle = data.topic.title;
  const quizSlug = data.topic.slug;

  let quiz = await Quiz.findOne({ slug: quizSlug });
  const timeLimit = Math.max(allQuestions.length * 60, 600); // 1 min per question or min 10 mins

  if (!quiz) {
    quiz = await Quiz.create({
      title: quizTitle,
      slug: quizSlug,
      subject: data.topic.subject,
      categoryId: category?._id,
      examTags: ["RSMSSB", "RPSC", "Rajasthan GK", data.topic.title],
      difficulty: "medium",
      status: "PUBLISHED",
      defaultMarks: 2,
      defaultNegativeMarks: 0.66,
      timeLimitSeconds: timeLimit,
      publishedAt: new Date(),
    });
    console.log(`\nCreated single Topic Quiz: "${quizTitle}" (${quizSlug}) ID: ${quiz._id}`);
  } else {
    await Quiz.updateOne(
      { _id: quiz._id },
      {
        $set: {
          title: quizTitle,
          subject: data.topic.subject,
          categoryId: category?._id,
          status: "PUBLISHED",
          timeLimitSeconds: timeLimit,
        },
      }
    );
    console.log(`\nUpdated single Topic Quiz: "${quizTitle}" (${quizSlug}) ID: ${quiz._id}`);
  }

  // 4. Upsert all questions consecutively with order 1..N
  console.log(`\nSeeding ${allQuestions.length} questions into single Quiz (ID: ${quiz._id})...`);
  for (let i = 0; i < allQuestions.length; i++) {
    const order = i + 1;
    const q = allQuestions[i];

    await QuizQuestion.findOneAndUpdate(
      { quizId: quiz._id, order: order },
      {
        $set: {
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || "",
          marks: 2,
          negativeMarks: 0.66,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Remove any stale questions beyond current total length
  const deletedStale = await QuizQuestion.deleteMany({
    quizId: quiz._id,
    order: { $gt: allQuestions.length },
  });
  if (deletedStale.deletedCount > 0) {
    console.log(`Removed ${deletedStale.deletedCount} stale question(s) with order > ${allQuestions.length}.`);
  }

  const finalCount = await QuizQuestion.countDocuments({ quizId: quiz._id });
  console.log(`\nVerified Question Count in DB for "${quizTitle}": ${finalCount}`);

  await mongoose.disconnect();
  console.log(`\n[DATABASE SEED COMPLETE] Single topic quiz successfully created and seeded.`);
}

main().catch((err) => {
  console.error("Error executing seed:", err);
  process.exit(1);
});
