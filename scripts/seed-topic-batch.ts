import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";

async function main() {
  const isApply = process.argv.includes("--apply");
  const filePath =
    process.argv.find((arg) => arg.endsWith(".json")) ||
    path.join(process.cwd(), "question-bank", "seeds", "rajasthan-history-ekikaran.json");

  console.log(`=== TOPIC SEED / DB INGESTION ===`);
  console.log(`Source File: ${filePath}`);
  console.log(`Mode: ${isApply ? "LIVE APPLY (Modifying MongoDB)" : "DRY RUN (Read Only)"}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File not found: ${filePath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Topic: ${data.topic.title}`);
  console.log(`Subject: ${data.topic.subject}`);
  console.log(`Batches: ${data.batches.length}`);

  let totalQuestionsCount = 0;
  for (const b of data.batches) {
    totalQuestionsCount += b.questions.length;
  }
  console.log(`Total Questions across all batches: ${totalQuestionsCount}`);

  if (!isApply) {
    console.log(`\n[DRY RUN COMPLETE] Zero database writes performed.`);
    console.log(`Run with '--apply' when ready to seed into MongoDB.`);
    return;
  }

  await connectToDatabase();
  console.log("Connected to MongoDB.");

  for (const b of data.batches) {
    const quizTitle = `${data.topic.title} - ${b.batchName}`;
    const quizSlug = `${data.topic.slug}-${b.batchName.toLowerCase().replace(/\s+/g, "-")}`;

    console.log(`\nProcessing Quiz: "${quizTitle}" (${quizSlug})`);

    let quiz = await Quiz.findOne({ slug: quizSlug });
    if (!quiz) {
      quiz = await Quiz.create({
        title: quizTitle,
        slug: quizSlug,
        subject: data.topic.subject,
        examTags: ["RSMSSB", "RPSC", "Rajasthan GK"],
        difficulty: "medium",
        status: "PUBLISHED",
        defaultMarks: 2,
        defaultNegativeMarks: 0.66,
        timeLimitSeconds: b.questions.length * 60,
        questionCount: b.questions.length,
      });
      console.log(`- Created Quiz record with ID: ${quiz._id}`);
    } else {
      console.log(`- Found existing Quiz record with ID: ${quiz._id}`);
    }

    // Insert questions
    let inserted = 0;
    for (const q of b.questions) {
      const existing = await QuizQuestion.findOne({
        quizId: quiz._id,
        order: q.order,
      });

      if (existing) {
        await QuizQuestion.updateOne(
          { _id: existing._id },
          {
            $set: {
              questionText: q.questionText,
              options: q.options,
              correctOptionIndex: q.correctOptionIndex,
              explanation: q.explanation || "",
            },
          }
        );
      } else {
        await QuizQuestion.create({
          quizId: quiz._id,
          order: q.order,
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation || "",
          marks: 2,
          negativeMarks: 0.66,
        });
      }
      inserted++;
    }

    console.log(`- Seeded ${inserted} questions for "${quizTitle}" successfully.`);
  }

  await mongoose.disconnect();
  console.log(`\n[DATABASE SEED COMPLETE] All batches saved.`);
}

main().catch(console.error);
