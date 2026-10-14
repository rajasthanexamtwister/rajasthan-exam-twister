import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { Quiz } from "../server/models/Quiz";
import { QuizQuestion } from "../server/models/QuizQuestion";
import mongoose from "mongoose";

interface QuestionFixCandidate {
  quizId: string;
  quizTitle: string;
  questionId: string;
  order: number;
  questionText: string;
  options: string[];
  oldCorrectIndex: number;
  newCorrectIndex: number;
  rationale: string;
}

// Normalize Devanagari Hindi text for clean comparison
function cleanText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[\u0901\u0902]/g, "न")
    .replace(/[^a-zA-Z0-9\u0900-\u097F]/g, "")
    .trim();
}

/**
 * Audit question options against explicit keys and explanation
 */
function analyzeQuestion(q: {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}): { needsFix: boolean; detectedIndex?: number; rationale?: string } {
  const explanation = q.explanation || "";
  const opts = q.options || [];
  if (opts.length < 2) return { needsFix: false };

  // 1. Detect explicit key patterns in explanation: e.g. "उत्तर: D", "विकल्प 4", "(4)", "Option 4"
  const opt4Regex = /(?:उत्तर|विकल्प|Option|Ans(?:wer)?)\s*[:=\-–]?\s*(?:4|D|द|\(4\)|\(D\)|\(द\))|^\s*(?:\(4\)|\(D\)|\(द\)|4\.|D\.)/i;
  const opt1Regex = /(?:उत्तर|विकल्प|Option|Ans(?:wer)?)\s*[:=\-–]?\s*(?:1|A|अ|\(1\)|\(A\)|\(अ\))|^\s*(?:\(1\)|\(A\)|\(अ\)|1\.|A\.)/i;
  const opt2Regex = /(?:उत्तर|विकल्प|Option|Ans(?:wer)?)\s*[:=\-–]?\s*(?:2|B|ब|\(2\)|\(B\)|\(ब\))|^\s*(?:\(2\)|\(B\)|\(ब\)|2\.|B\.)/i;
  const opt3Regex = /(?:उत्तर|विकल्प|Option|Ans(?:wer)?)\s*[:=\-–]?\s*(?:3|C|स|\(3\)|\(C\)|\(स\))|^\s*(?:\(3\)|\(C\)|\(स\)|3\.|C\.)/i;

  if (opt4Regex.test(explanation) && opts.length >= 4 && q.correctOptionIndex !== 3) {
    return {
      needsFix: true,
      detectedIndex: 3,
      rationale: "Explanation explicitly designates Option 4/D as correct answer.",
    };
  }

  if (opt1Regex.test(explanation) && q.correctOptionIndex !== 0) {
    return {
      needsFix: true,
      detectedIndex: 0,
      rationale: "Explanation explicitly designates Option 1/A as correct answer.",
    };
  }

  if (opt2Regex.test(explanation) && opts.length >= 2 && q.correctOptionIndex !== 1) {
    return {
      needsFix: true,
      detectedIndex: 1,
      rationale: "Explanation explicitly designates Option 2/B as correct answer.",
    };
  }

  if (opt3Regex.test(explanation) && opts.length >= 3 && q.correctOptionIndex !== 2) {
    return {
      needsFix: true,
      detectedIndex: 2,
      rationale: "Explanation explicitly designates Option 3/C as correct answer.",
    };
  }

  return { needsFix: false };
}

async function main() {
  const isApply = process.argv.includes("--apply");
  console.log(`=== Quiz Answer Migration & Audit Tool ===`);
  console.log(`Mode: ${isApply ? "LIVE APPLY (Modifying Database)" : "DRY RUN (Read Only)"}\n`);

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB successfully.\n");

    const quizzes = await Quiz.find({}).lean();
    console.log(`Found ${quizzes.length} total quizzes to audit.`);

    const fixes: QuestionFixCandidate[] = [];

    for (const quiz of quizzes) {
      const questions = await QuizQuestion.find({ quizId: quiz._id }).sort({ order: 1 }).lean();

      for (const q of questions) {
        const analysis = analyzeQuestion({
          questionText: q.questionText,
          options: q.options,
          correctOptionIndex: q.correctOptionIndex,
          explanation: q.explanation,
        });

        if (analysis.needsFix && analysis.detectedIndex !== undefined) {
          fixes.push({
            quizId: quiz._id.toString(),
            quizTitle: quiz.title,
            questionId: q._id.toString(),
            order: q.order,
            questionText: q.questionText,
            options: q.options,
            oldCorrectIndex: q.correctOptionIndex,
            newCorrectIndex: analysis.detectedIndex,
            rationale: analysis.rationale || "Explanation analysis",
          });
        }
      }
    }

    console.log(`\nAudit completed: Found ${fixes.length} question(s) requiring correction.`);

    if (fixes.length === 0) {
      console.log("All question correctOptionIndex values are fully aligned with explanations!");
      return;
    }

    // Print fix summary table
    console.table(
      fixes.map((f) => ({
        Order: f.order,
        Quiz: f.quizTitle.substring(0, 30),
        "Old Index": `Option ${f.oldCorrectIndex + 1}`,
        "New Index": `Option ${f.newCorrectIndex + 1}`,
        Rationale: f.rationale,
      }))
    );

    // If apply is specified, create backup before applying changes
    if (isApply) {
      const backupDir = path.join(process.cwd(), "question-bank", "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(
        backupDir,
        `quiz-questions-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );

      fs.writeFileSync(backupFile, JSON.stringify(fixes, null, 2), "utf-8");
      console.log(`\n[BACKUP CREATED]: Pre-migration snapshot saved to ${backupFile}`);

      console.log("\nApplying database updates...");
      let appliedCount = 0;
      for (const fix of fixes) {
        await QuizQuestion.updateOne(
          { _id: new mongoose.Types.ObjectId(fix.questionId) },
          { $set: { correctOptionIndex: fix.newCorrectIndex } }
        );
        appliedCount++;
      }
      console.log(`Successfully migrated and updated ${appliedCount} question(s) in MongoDB.`);
    } else {
      console.log("\n[DRY RUN COMPLETE] No records were modified. Run with '--apply' to update MongoDB.");
    }
  } catch (err: any) {
    console.error("Migration script error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
