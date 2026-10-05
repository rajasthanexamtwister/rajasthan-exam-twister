import "dotenv/config";
import path from "path";
import { QuestionBankAutomationEngine } from "../server/services/question-bank-automation/engine";

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const targetDir = path.join(process.cwd(), "question-bank/newQuestions");
  console.log(`\n=============================================================`);
  console.log(`⚡ RAJASTHAN EXAM TWISTER — QUESTION BANK AUTOMATION ENGINE ⚡`);
  console.log(`=============================================================`);
  console.log(`Target Folder: ${targetDir}`);
  console.log(`Mode: ${dryRun ? "DRY RUN (No DB Writes, No File Deletions)" : "LIVE AUTOMATION (Seed to DRAFT & Cleanup Completed Files)"}\n`);

  const summary = await QuestionBankAutomationEngine.processDirectory(targetDir, dryRun);

  console.log(`\n-------------------------------------------------------------`);
  console.log(`📊 SUMMARY REPORT FOR PROCESSED FILES`);
  console.log(`-------------------------------------------------------------`);

  for (const rep of summary.reports) {
    console.log(`\n📄 File: ${rep.fileName}`);
    console.log(`   Subject: ${rep.subject}`);
    console.log(`   Topic: ${rep.topic}`);
    console.log(`   Total Questions Found: ${rep.totalFound}`);
    console.log(`   Successfully Verified: ${rep.verifiedCount}`);
    console.log(`   Imported to DB: ${rep.importedCount}`);
    console.log(`   Duplicates Skipped: ${rep.duplicateCount}`);
    console.log(`   Exam/Year Found: ${rep.examTagFoundCount}`);
    console.log(`   Explanations Generated: ${rep.explanationGeneratedCount}`);
    console.log(`   Questions Needing Review: ${rep.reviewNeededCount}`);
    if (rep.topicQuizId) {
      console.log(`   Topic Quiz ID: ${rep.topicQuizId}`);
    }
    console.log(`   File Status: ${rep.fileDeleted ? "DELETED (All 100% Seeded Successfully)" : "RETAINED"}`);

    if (rep.issues.length > 0) {
      console.log(`   ⚠️ Issues Flagged:`);
      rep.issues.forEach((iss) => {
        console.log(`      - Q${iss.questionOrder}: ${iss.issue}`);
      });
    }
    if (rep.error) {
      console.log(`   ❌ Note: ${rep.error}`);
    }
  }

  console.log(`\n=============================================================`);
  console.log(`🎯 OVERALL BATCH TOTALS`);
  console.log(`=============================================================`);
  console.log(`Total Files Scanned: ${summary.totalFilesScanned}`);
  console.log(`Files Processed & Seeded: ${summary.successfulFilesCount}`);
  console.log(`Files Needing Review / Retained: ${summary.reviewPendingFilesCount + summary.failedFilesCount}`);
  console.log(`Total Questions Discovered: ${summary.totalQuestionsFound}`);
  console.log(`Total Questions Imported: ${summary.totalQuestionsImported}`);
  console.log(`Total Duplicates Skipped: ${summary.totalDuplicatesSkipped}`);
  console.log(`Total Questions Flagged for Review: ${summary.totalQuestionsNeedingReview}`);
  console.log(`Local Files Deleted: ${summary.deletedFiles.length}`);
  console.log(`Local Files Retained: ${summary.retainedFiles.length}`);
  console.log(`=============================================================\n`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Automation fatal error:", err);
    process.exit(1);
  });
