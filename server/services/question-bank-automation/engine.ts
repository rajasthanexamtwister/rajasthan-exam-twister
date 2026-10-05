import fs from "fs";
import path from "path";
import {
  FileProcessingReport,
  AutomationBatchSummary,
  QuestionProcessingIssue,
} from "./types";
import { parseMarkdownQuestionFile } from "./parser";
import { verifyQuestion } from "./verifier";
import { seedQuestionsToTopicBank } from "./seeder";

export class QuestionBankAutomationEngine {
  /**
   * Recursively finds all .md files in the target directory
   */
  static collectMarkdownFiles(dir: string): string[] {
    const mdFiles: string[] = [];
    if (!fs.existsSync(dir)) return mdFiles;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (
          entry.name === "node_modules" ||
          entry.name === ".git" ||
          entry.name === ".next"
        ) {
          continue;
        }
        mdFiles.push(...this.collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        mdFiles.push(fullPath);
      }
    }

    return mdFiles;
  }

  /**
   * Processes a single markdown question file
   */
  static async processFile(
    filePath: string,
    dryRun: boolean = false
  ): Promise<FileProcessingReport> {
    const fileName = path.basename(filePath);

    try {
      const rawContent = fs.readFileSync(filePath, "utf-8");
      const { subject, topic, questions: parsedQuestions } = parseMarkdownQuestionFile(
        rawContent,
        filePath
      );

      if (parsedQuestions.length === 0) {
        return {
          filePath,
          fileName,
          subject,
          topic,
          totalFound: 0,
          verifiedCount: 0,
          importedCount: 0,
          duplicateCount: 0,
          examTagFoundCount: 0,
          explanationGeneratedCount: 0,
          reviewNeededCount: 0,
          fileDeleted: false,
          error: "No parseable questions found in markdown file.",
          issues: [],
        };
      }

      // Verify each question
      const allIssues: QuestionProcessingIssue[] = [];
      const verifiedQuestions = [];
      let examTagFoundCount = 0;
      let explanationGeneratedCount = 0;
      let reviewNeededCount = 0;

      for (const q of parsedQuestions) {
        const { verified, issues } = verifyQuestion(q, topic);
        if (issues.length > 0) {
          allIssues.push(...issues);
          reviewNeededCount++;
        } else {
          verifiedQuestions.push(verified);
          if (verified.verifiedExamTag) examTagFoundCount++;
          if (verified.verifiedExplanation) explanationGeneratedCount++;
        }
      }

      // If any question requires human review, halt automatic database deletion
      if (reviewNeededCount > 0) {
        return {
          filePath,
          fileName,
          subject,
          topic,
          totalFound: parsedQuestions.length,
          verifiedCount: verifiedQuestions.length,
          importedCount: 0,
          duplicateCount: 0,
          examTagFoundCount,
          explanationGeneratedCount,
          reviewNeededCount,
          fileDeleted: false,
          error: `${reviewNeededCount} question(s) flagged for manual review. File preserved.`,
          issues: allIssues,
        };
      }

      let importedCount = 0;
      let duplicateCount = 0;
      let topicQuizId: string | undefined = undefined;

      if (!dryRun) {
        const seedResult = await seedQuestionsToTopicBank(subject, topic, verifiedQuestions);
        importedCount = seedResult.importedCount;
        duplicateCount = seedResult.duplicateCount;
        topicQuizId = seedResult.topicQuizId;
      } else {
        // Dry run simulation
        importedCount = verifiedQuestions.length;
      }

      // Safe Local File Cleanup Invariant:
      // Only delete local source .md file when ALL questions are verified & seeded with 0 review flags
      let fileDeleted = false;
      const allAccountedFor = importedCount + duplicateCount === parsedQuestions.length;

      if (!dryRun && allAccountedFor && reviewNeededCount === 0) {
        try {
          fs.unlinkSync(filePath);
          fileDeleted = true;
        } catch (unlinkErr) {
          console.error(`Failed to delete local file ${filePath}:`, unlinkErr);
        }
      }

      return {
        filePath,
        fileName,
        subject,
        topic,
        totalFound: parsedQuestions.length,
        verifiedCount: verifiedQuestions.length,
        importedCount,
        duplicateCount,
        examTagFoundCount,
        explanationGeneratedCount,
        reviewNeededCount,
        topicQuizId,
        fileDeleted,
        issues: allIssues,
      };
    } catch (err: any) {
      return {
        filePath,
        fileName,
        subject: "Unknown",
        topic: "Unknown",
        totalFound: 0,
        verifiedCount: 0,
        importedCount: 0,
        duplicateCount: 0,
        examTagFoundCount: 0,
        explanationGeneratedCount: 0,
        reviewNeededCount: 0,
        fileDeleted: false,
        error: err.message || "Failed to process markdown file",
        issues: [],
      };
    }
  }

  /**
   * Processes all .md files in the question-bank/newQuestions folder
   */
  static async processDirectory(
    targetDir: string,
    dryRun: boolean = false
  ): Promise<AutomationBatchSummary> {
    const files = this.collectMarkdownFiles(targetDir);

    const reports: FileProcessingReport[] = [];
    const deletedFiles: string[] = [];
    const retainedFiles: string[] = [];

    let totalQuestionsFound = 0;
    let totalQuestionsImported = 0;
    let totalDuplicatesSkipped = 0;
    let totalQuestionsNeedingReview = 0;
    let successfulFilesCount = 0;
    let reviewPendingFilesCount = 0;
    let failedFilesCount = 0;

    for (const file of files) {
      const report = await this.processFile(file, dryRun);
      reports.push(report);

      totalQuestionsFound += report.totalFound;
      totalQuestionsImported += report.importedCount;
      totalDuplicatesSkipped += report.duplicateCount;
      totalQuestionsNeedingReview += report.reviewNeededCount;

      if (report.error && report.totalFound === 0) {
        failedFilesCount++;
        retainedFiles.push(file);
      } else if (report.reviewNeededCount > 0) {
        reviewPendingFilesCount++;
        retainedFiles.push(file);
      } else {
        successfulFilesCount++;
        if (report.fileDeleted) {
          deletedFiles.push(file);
        } else {
          retainedFiles.push(file);
        }
      }
    }

    return {
      totalFilesScanned: files.length,
      successfulFilesCount,
      reviewPendingFilesCount,
      failedFilesCount,
      totalQuestionsFound,
      totalQuestionsImported,
      totalDuplicatesSkipped,
      totalQuestionsNeedingReview,
      deletedFiles,
      retainedFiles,
      reports,
    };
  }
}
