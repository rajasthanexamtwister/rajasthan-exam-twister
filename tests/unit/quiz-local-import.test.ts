import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  collectJsonFiles,
  moveFileToImported,
  importQuizzesFromDirectory,
} from "@/scripts/import-local-quizzes";
import { QuizService } from "@/server/services/quiz-service";
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

  describe("collectJsonFiles", () => {
    it("finds all .json files recursively and ignores 'imported' directory", () => {
      fs.writeFileSync(path.join(tempDir, "quiz1.json"), "{}");
      fs.writeFileSync(path.join(tempDir, "notes.txt"), "some text");

      const subDir = path.join(tempDir, "sub");
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, "quiz2.json"), "{}");

      const importedDir = path.join(tempDir, "imported");
      fs.mkdirSync(importedDir);
      fs.writeFileSync(path.join(importedDir, "already-imported.json"), "{}");

      const files = collectJsonFiles(tempDir, tempDir);
      const fileNames = files.map((f) => path.basename(f));

      expect(fileNames).toContain("quiz1.json");
      expect(fileNames).toContain("quiz2.json");
      expect(fileNames).not.toContain("already-imported.json");
      expect(fileNames).not.toContain("notes.txt");
      expect(files).toHaveLength(2);
    });
  });

  describe("moveFileToImported", () => {
    it("moves the file safely into <baseDir>/imported/ and does not delete it", () => {
      const filePath = path.join(tempDir, "sample-quiz.json");
      fs.writeFileSync(filePath, '{"test": true}');

      const destPath = moveFileToImported(filePath, tempDir);

      expect(fs.existsSync(filePath)).toBe(false); // moved from original
      expect(fs.existsSync(destPath)).toBe(true); // exists in imported/
      expect(destPath.includes("imported")).toBe(true);
      expect(fs.readFileSync(destPath, "utf-8")).toBe('{"test": true}');
    });
  });

  describe("importQuizzesFromDirectory", () => {
    it("successfully imports valid quiz JSON, calls QuizService, and moves file to imported/", async () => {
      const validQuizPayload = {
        quizTitle: "Rajasthan History Battle Mock",
        subject: "Rajasthan History",
        examTags: ["REET", "RPSC"],
        difficulty: "medium",
        questions: [
          {
            questionText: "Where did the Battle of Khanwa take place?",
            options: ["Bharatpur", "Jaipur", "Ajmer", "Bikaner"],
            correctOptionIndex: 0,
            explanation: "The Battle of Khanwa occurred near Bharatpur in 1527.",
            marks: 1,
            negativeMarks: 0.33,
          },
        ],
      };

      const filePath = path.join(tempDir, "history-mock.json");
      fs.writeFileSync(filePath, JSON.stringify(validQuizPayload));

      // Mock DB: no duplicate
      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      // Mock QuizService.importQuizJson
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

      const summary = await importQuizzesFromDirectory(tempDir, { moveOnSuccess: true });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(1);
      expect(summary.duplicateCount).toBe(0);
      expect(summary.failedCount).toBe(0);

      expect(summary.results[0].status).toBe("SUCCESS");
      expect(summary.results[0].quizTitle).toBe("Rajasthan History Battle Mock");
      expect(summary.results[0].quizId).toBe("65f333333333333333333331");

      // Verify file moved to imported/
      expect(fs.existsSync(filePath)).toBe(false);
      expect(summary.results[0].destinationPath).toBeDefined();
      expect(fs.existsSync(summary.results[0].destinationPath!)).toBe(true);
    });

    it("detects duplicate quiz slug/title, skips creation, and leaves file in place", async () => {
      const duplicatePayload = {
        quizTitle: "Existing Rajasthan Quiz",
        subject: "Geography",
        questions: [
          {
            questionText: "Capital of Rajasthan?",
            options: ["Jaipur", "Jodhpur"],
            correctOptionIndex: 0,
          },
        ],
      };

      const filePath = path.join(tempDir, "existing-quiz.json");
      fs.writeFileSync(filePath, JSON.stringify(duplicatePayload));

      // Mock DB: duplicate found
      vi.spyOn(Quiz, "findOne").mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "65f999999999999999999999",
          title: "Existing Rajasthan Quiz",
          slug: "existing-rajasthan-quiz",
        }),
      } as any);

      const importSpy = vi.spyOn(QuizService, "importQuizJson");

      const summary = await importQuizzesFromDirectory(tempDir, { moveOnSuccess: true });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(0);
      expect(summary.duplicateCount).toBe(1);
      expect(summary.failedCount).toBe(0);

      expect(summary.results[0].status).toBe("DUPLICATE");
      expect(importSpy).not.toHaveBeenCalled();

      // Verify file remained in place (NOT moved)
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("rejects invalid schema (e.g. correctOptionIndex out of range) and leaves file in place", async () => {
      const invalidPayload = {
        quizTitle: "Faulty Options Quiz",
        subject: "Polity",
        questions: [
          {
            questionText: "Sample question?",
            options: ["Option A", "Option B"],
            correctOptionIndex: 5, // Invalid: only 2 options (index 0,1)
          },
        ],
      };

      const filePath = path.join(tempDir, "invalid-quiz.json");
      fs.writeFileSync(filePath, JSON.stringify(invalidPayload));

      const summary = await importQuizzesFromDirectory(tempDir, { moveOnSuccess: true });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(0);
      expect(summary.duplicateCount).toBe(0);
      expect(summary.failedCount).toBe(1);

      expect(summary.results[0].status).toBe("FAILED");
      expect(summary.results[0].reason).toContain("correctOptionIndex must be less than options.length");

      // Verify file remained in place
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("rejects corrupted / non-JSON file and logs syntax error", async () => {
      const filePath = path.join(tempDir, "corrupted.json");
      fs.writeFileSync(filePath, "{ bad-json ::: ");

      const summary = await importQuizzesFromDirectory(tempDir, { moveOnSuccess: true });

      expect(summary.totalFiles).toBe(1);
      expect(summary.successCount).toBe(0);
      expect(summary.failedCount).toBe(1);

      expect(summary.results[0].status).toBe("FAILED");
      expect(summary.results[0].reason).toContain("Invalid JSON syntax");

      // Verify file remained in place
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});
