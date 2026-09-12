import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  collectJsonFiles,
  moveFileToFolder,
  importQuizzesFromDirectory,
} from "@/scripts/import-local-quizzes";
import { QuizService, computeQuizContentFingerprint } from "@/server/services/quiz-service";
import { Quiz } from "@/server/models/Quiz";
import { IQuiz } from "@/server/models/Quiz";

describe("Local Quiz Batch Importer (scripts/import-local-quizzes.ts)", () => {
  let tempDir: string;

  beforeEach(() => {
    vi.restoreAllMocks();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-import-test-"));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("computeQuizContentFingerprint", () => {
    it("computes deterministic boundary SHA-256 fingerprint for question content", () => {
      const questions1 = [
        { questionText: "What is the capital of Rajasthan?", options: ["Jaipur", "Jodhpur", "Udaipur", "Kota"] },
        { questionText: "Which is the longest river in Rajasthan?", options: ["Chambal", "Banas", "Luni", "Mahi"] },
      ];

      const questions2 = [
        { questionText: "What is the capital of Rajasthan?", options: ["Jaipur", "Jodhpur", "Udaipur", "Kota"] },
        { questionText: "Which is the longest river in Rajasthan?", options: ["Chambal", "Banas", "Luni", "Mahi"] },
      ];

      const fp1 = computeQuizContentFingerprint(questions1);
      const fp2 = computeQuizContentFingerprint(questions2);

      expect(fp1).toBe(fp2);
      expect(fp1).toHaveLength(64); // SHA-256 hex string

      // Different questions yield different fingerprint
      const questions3 = [
        { questionText: "Different question entirely?", options: ["A", "B"] },
      ];
      const fp3 = computeQuizContentFingerprint(questions3);
      expect(fp1).not.toBe(fp3);
    });

    it("samples first 50 and last 50 lines for large question sets (>100 lines)", () => {
      const largeQuestions = Array.from({ length: 40 }, (_, idx) => ({
        questionText: `Question number ${idx + 1} for examination`,
        options: [`Option 1 for ${idx + 1}`, `Option 2 for ${idx + 1}`, `Option 3 for ${idx + 1}`, `Option 4 for ${idx + 1}`],
      }));

      const fp = computeQuizContentFingerprint(largeQuestions);
      expect(fp).toHaveLength(64);
    });
  });

  describe("collectJsonFiles", () => {
    it("finds all .json files recursively and ignores 'imported' and 'duplicate' directories", () => {
      fs.writeFileSync(path.join(tempDir, "quiz1.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "notes.txt"), "some text");

      const subDir = path.join(tempDir, "sub");
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, "quiz2.json"), "{}");

      const importedDir = path.join(tempDir, "imported");
      fs.mkdirSync(importedDir);
      fs.writeFileSync(path.join(importedDir, "already-imported.json"), "{}");

      const duplicateDir = path.join(tempDir, "duplicate");
      fs.mkdirSync(duplicateDir);
      fs.writeFileSync(path.join(duplicateDir, "already-duplicate.json"), "{}");

      const files = collectJsonFiles(tempDir, tempDir);
      const fileNames = files.map((f) => path.basename(f));

      expect(fileNames).toContain("quiz1.json");
      expect(fileNames).toContain("quiz2.json");
      expect(fileNames).not.toContain("already-imported.json");
      expect(fileNames).not.toContain("already-duplicate.json");
      expect(fileNames).not.toContain("notes.txt");
      expect(files).toHaveLength(2);
    });
  });

  describe("moveFileToFolder", () => {
    it("moves the file safely into <baseDir>/imported/ and does not delete it", () => {
      const filePath = path.join(tempDir, "sample-quiz.json");
      fs.writeFileSync(filePath, '{"test": true}');

      const destPath = moveFileToFolder(filePath, tempDir, "imported");

      expect(fs.existsSync(filePath)).toBe(false); // moved from original
      expect(fs.existsSync(destPath)).toBe(true); // exists in imported/
      expect(destPath.includes("imported")).toBe(true);
      expect(fs.readFileSync(destPath, "utf-8")).toBe('{"test": true}');
    });

    it("moves duplicate files safely into <baseDir>/duplicate/", () => {
      const filePath = path.join(tempDir, "duplicate-quiz.json");
      fs.writeFileSync(filePath, '{"dup": true}');

      const destPath = moveFileToFolder(filePath, tempDir, "duplicate");

      expect(fs.existsSync(filePath)).toBe(false);
      expect(fs.existsSync(destPath)).toBe(true);
      expect(destPath.includes("duplicate")).toBe(true);
    });
  });

  describe("importQuizzesFromDirectory - DRY RUN MODE", () => {
    it("validates files and checks duplicates without modifying DB or moving any files", async () => {
      const validQuizPayload = {
        quizTitle: "Rajasthan History Battle Mock",
        subject: "Rajasthan History",
        questions: [
          {
            questionText: "Where did the Battle of Khanwa take place?",
            options: ["Bharatpur", "Jaipur", "Ajmer", "Bikaner"],
            correctOptionIndex: 0,
          },
        ],
      };

      const filePath = path.join(tempDir, "history-mock.json");
      fs.writeFileSync(filePath, JSON.stringify(validQuizPayload));

      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const importSpy = vi.spyOn(QuizService, "importQuizJson");

      const summary = await importQuizzesFromDirectory(tempDir, { dryRun: true });

      expect(summary.dryRun).toBe(true);
      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(1);
      expect(summary.duplicateCount).toBe(0);
      expect(summary.failedCount).toBe(0);

      // In DRY RUN: QuizService is NOT called and file is NOT moved
      expect(importSpy).not.toHaveBeenCalled();
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "imported"))).toBe(false);
    });
  });

  describe("importQuizzesFromDirectory - LIVE MODE", () => {
    it("successfully imports valid quiz JSON, calls QuizService, and moves file to imported/", async () => {
      const validQuizPayload = {
        quizTitle: "Rajasthan History Battle Mock",
        subject: "Rajasthan History",
        questions: [
          {
            questionText: "Where did the Battle of Khanwa take place?",
            options: ["Bharatpur", "Jaipur", "Ajmer", "Bikaner"],
            correctOptionIndex: 0,
          },
        ],
      };

      const filePath = path.join(tempDir, "history-mock.json");
      fs.writeFileSync(filePath, JSON.stringify(validQuizPayload));

      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      const mockCreatedQuiz = {
        _id: "65f333333333333333333331",
        title: "Rajasthan History Battle Mock",
        slug: "rajasthan-history-battle-mock",
        status: "DRAFT",
      } as unknown as IQuiz;

      vi.spyOn(QuizService, "importQuizJson").mockResolvedValueOnce({
        quiz: mockCreatedQuiz,
        questionCount: 1,
      });

      const summary = await importQuizzesFromDirectory(tempDir, { dryRun: false });

      expect(summary.dryRun).toBe(false);
      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(1);
      expect(summary.duplicateCount).toBe(0);
      expect(summary.failedCount).toBe(0);

      expect(summary.results[0].status).toBe("SUCCESS");
      expect(summary.results[0].quizTitle).toBe("Rajasthan History Battle Mock");

      // Verify file moved to imported/
      expect(fs.existsSync(filePath)).toBe(false);
      expect(summary.results[0].destinationPath).toBeDefined();
      expect(fs.existsSync(summary.results[0].destinationPath!)).toBe(true);
    });

    it("detects duplicate by boundary content fingerprint (even with different title) and moves to duplicate/", async () => {
      const duplicateContentPayload = {
        quizTitle: "Completely Different Title But Same Questions",
        subject: "Geography",
        questions: [
          {
            questionText: "Capital of Rajasthan?",
            options: ["Jaipur", "Jodhpur"],
            correctOptionIndex: 0,
          },
        ],
      };

      const fp = computeQuizContentFingerprint(duplicateContentPayload.questions);
      const filePath = path.join(tempDir, "content-dup.json");
      fs.writeFileSync(filePath, JSON.stringify(duplicateContentPayload));

      // Mock DB: matching contentFingerprint found on an existing quiz
      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "65f999999999999999999999",
          title: "Original Rajasthan Capital Quiz",
          slug: "original-rajasthan-capital-quiz",
          contentFingerprint: fp,
        }),
      } as any);

      const importSpy = vi.spyOn(QuizService, "importQuizJson");

      const summary = await importQuizzesFromDirectory(tempDir, { dryRun: false });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(0);
      expect(summary.duplicateCount).toBe(1);
      expect(summary.failedCount).toBe(0);

      expect(summary.results[0].status).toBe("DUPLICATE");
      expect(summary.results[0].reason).toContain("Duplicate content fingerprint match");
      expect(importSpy).not.toHaveBeenCalled();

      // Verify file moved to duplicate/ folder
      expect(fs.existsSync(filePath)).toBe(false);
      expect(summary.results[0].destinationPath).toBeDefined();
      expect(fs.existsSync(summary.results[0].destinationPath!)).toBe(true);
      expect(summary.results[0].destinationPath!.includes("duplicate")).toBe(true);
    });

    it("detects intra-batch duplicates and moves the duplicate file to duplicate/", async () => {
      const payload1 = {
        quizTitle: "Batch Quiz 1",
        questions: [{ questionText: "Shared question", options: ["A", "B"], correctOptionIndex: 0 }],
      };
      const payload2 = {
        quizTitle: "Batch Quiz 2 With Same Question",
        questions: [{ questionText: "Shared question", options: ["A", "B"], correctOptionIndex: 0 }],
      };

      fs.writeFileSync(path.join(tempDir, "batch1.json"), JSON.stringify(payload1));
      fs.writeFileSync(path.join(tempDir, "batch2.json"), JSON.stringify(payload2));

      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      vi.spyOn(QuizService, "importQuizJson").mockResolvedValue({
        quiz: { _id: "65f111", title: "Batch Quiz 1", slug: "batch-quiz-1" } as any,
        questionCount: 1,
      });

      const summary = await importQuizzesFromDirectory(tempDir, { dryRun: false });

      expect(summary.totalFiles).toBe(2);
      expect(summary.successCount).toBe(1);
      expect(summary.duplicateCount).toBe(1);

      expect(fs.existsSync(path.join(tempDir, "imported", "batch1.json"))).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "duplicate", "batch2.json"))).toBe(true);
    });

    it("rejects invalid schema and leaves file untouched in source folder", async () => {
      const invalidPayload = {
        quizTitle: "Faulty Options Quiz",
        questions: [
          {
            questionText: "Sample question?",
            options: ["Option A", "Option B"],
            correctOptionIndex: 5, // Invalid index
          },
        ],
      };

      const filePath = path.join(tempDir, "invalid-quiz.json");
      fs.writeFileSync(filePath, JSON.stringify(invalidPayload));

      const summary = await importQuizzesFromDirectory(tempDir, { dryRun: false });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(0);
      expect(summary.failedCount).toBe(1);

      expect(summary.results[0].status).toBe("FAILED");
      expect(summary.results[0].reason).toContain("correctOptionIndex must be less than options.length");

      // Verify file remained untouched in source folder
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.existsSync(path.join(tempDir, "imported"))).toBe(false);
      expect(fs.existsSync(path.join(tempDir, "duplicate"))).toBe(false);
    });
  });
});
