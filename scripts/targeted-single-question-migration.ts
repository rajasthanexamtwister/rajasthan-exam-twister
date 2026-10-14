import "dotenv/config";
import fs from "fs";
import path from "path";
import { connectToDatabase } from "../server/lib/mongodb";
import { QuizQuestion } from "../server/models/QuizQuestion";
import mongoose from "mongoose";

const TARGET_QUESTION_ID = "6aa5a0ae0faa12b08394a686";
const TARGET_QUIZ_TITLE = "PAPERS - Rssb Forest Guard 2026";
const EXPECTED_OLD_INDEX = 2; // Option 3
const TARGET_NEW_INDEX = 3;   // Option 4

async function main() {
  const isApply = process.argv.includes("--apply");
  const isRollback = process.argv.includes("--rollback");

  console.log(`=== Targeted Single-Question Migration ===`);
  console.log(`Target Question ID: ${TARGET_QUESTION_ID}`);
  console.log(`Target Quiz: ${TARGET_QUIZ_TITLE}`);
  console.log(`Mode: ${isRollback ? "ROLLBACK" : isApply ? "LIVE APPLY (Modifying MongoDB)" : "DRY RUN (Read Only)"}\n`);

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB successfully.\n");

    const question = await QuizQuestion.findById(TARGET_QUESTION_ID);
    if (!question) {
      console.error(`ERROR: Question ${TARGET_QUESTION_ID} not found in database!`);
      process.exit(1);
    }

    console.log(`Found Question in MongoDB:`);
    console.log(`- Order: ${question.order}`);
    console.log(`- Question: ${question.questionText.substring(0, 80)}...`);
    console.log(`- Current Stored Index: ${question.correctOptionIndex} ("${question.options[question.correctOptionIndex]}")`);

    // Handle Rollback
    if (isRollback) {
      const backupDir = path.join(process.cwd(), "question-bank", "backups");
      const backupFiles = fs.readdirSync(backupDir).filter((f) => f.startsWith("targeted-q5-backup-"));
      if (backupFiles.length === 0) {
        console.error("ERROR: No targeted backup file found to rollback from!");
        process.exit(1);
      }
      backupFiles.sort().reverse();
      const latestBackup = path.join(backupDir, backupFiles[0]);
      const backupData = JSON.parse(fs.readFileSync(latestBackup, "utf-8"));
      console.log(`\nRolling back using backup file: ${latestBackup}`);

      await QuizQuestion.updateOne(
        { _id: new mongoose.Types.ObjectId(TARGET_QUESTION_ID) },
        { $set: { correctOptionIndex: backupData.oldCorrectIndex } }
      );

      const restored = await QuizQuestion.findById(TARGET_QUESTION_ID);
      console.log(`[ROLLBACK SUCCESSFUL]: Restored correctOptionIndex to ${restored?.correctOptionIndex} ("${restored?.options[restored?.correctOptionIndex]}")`);
      return;
    }

    // Dry Run / Apply Logic
    if (question.correctOptionIndex !== EXPECTED_OLD_INDEX) {
      console.log(`\nNote: Question does not currently have index ${EXPECTED_OLD_INDEX}. It currently has index ${question.correctOptionIndex}.`);
      if (question.correctOptionIndex === TARGET_NEW_INDEX) {
        console.log(`Question is already updated to Option 4 (index ${TARGET_NEW_INDEX}). No update needed.`);
        return;
      }
    }

    console.log(`\nProposed Update:`);
    console.log(`- Old Index: ${question.correctOptionIndex} -> Option ${question.correctOptionIndex + 1} ("${question.options[question.correctOptionIndex]}")`);
    console.log(`- New Index: ${TARGET_NEW_INDEX} -> Option ${TARGET_NEW_INDEX + 1} ("${question.options[TARGET_NEW_INDEX]}")`);
    console.log(`- Authority: Indian Constitutional Law (Article 154/163): Governor is Constitutional Head, Chief Minister is Political Head.`);

    if (isApply) {
      // 1. Create verified backup
      const backupDir = path.join(process.cwd(), "question-bank", "backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(
        backupDir,
        `targeted-q5-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`
      );

      const snapshot = {
        questionId: TARGET_QUESTION_ID,
        quizId: question.quizId.toString(),
        quizTitle: TARGET_QUIZ_TITLE,
        order: question.order,
        oldCorrectIndex: question.correctOptionIndex,
        oldCorrectOptionText: question.options[question.correctOptionIndex],
        newCorrectIndex: TARGET_NEW_INDEX,
        newCorrectOptionText: question.options[TARGET_NEW_INDEX],
        snapshotTimestamp: new Date().toISOString(),
      };

      fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), "utf-8");
      console.log(`\n[BACKUP CREATED]: Pre-migration snapshot saved to ${backupFile}`);

      // 2. Perform write
      console.log("Applying targeted database update...");
      await QuizQuestion.updateOne(
        { _id: new mongoose.Types.ObjectId(TARGET_QUESTION_ID) },
        { $set: { correctOptionIndex: TARGET_NEW_INDEX } }
      );

      // 3. Post-verification
      const updated = await QuizQuestion.findById(TARGET_QUESTION_ID);
      console.log(`[UPDATE CONFIRMED]: MongoDB verified correctOptionIndex is now: ${updated?.correctOptionIndex}`);
    } else {
      console.log(`\n[DRY RUN COMPLETE] Zero database records modified.`);
      console.log(`To execute this write, run with '--apply'.`);
    }
  } catch (err: any) {
    console.error("Migration error:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
