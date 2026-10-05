import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import {
  detectSubjectFromFolder,
  detectTopicFromMarkdown,
  parseAnswerKeyToOptionIndex,
  detectQuestionFormat,
  extractExamYearTag,
  parseMarkdownQuestionFile,
} from "@/server/services/question-bank-automation/parser";
import { cleanOcrArtifacts, verifyQuestion } from "@/server/services/question-bank-automation/verifier";
import { seedQuestionsToTopicBank } from "@/server/services/question-bank-automation/seeder";
import { QuestionBankAutomationEngine } from "@/server/services/question-bank-automation/engine";
import { Quiz } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

describe("Question Bank Automation Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Subject & Topic Detection", () => {
    it("detects standard Subject from parent folder name", () => {
      expect(detectSubjectFromFolder("rajasthan-art-and-culture")).toBe("Rajasthan Art & Culture");
      expect(detectSubjectFromFolder("rajasthan-history")).toBe("Rajasthan History");
      expect(detectSubjectFromFolder("rajasthan-geography")).toBe("Rajasthan Geography");
      expect(detectSubjectFromFolder("general-hindi")).toBe("General Hindi");
      expect(detectSubjectFromFolder("computer-awareness")).toBe("Computer Awareness");
      expect(detectSubjectFromFolder("custom-exam-topic")).toBe("Custom Exam Topic");
    });

    it("detects Topic title from markdown heading with cleanup", () => {
      const md1 = "# राजस्थान में रीति -रिवाज एवं प्रथाएं\n\n1. Question...";
      expect(detectTopicFromMarkdown(md1, "test.md")).toBe("राजस्थान में रीति-रिवाज एवं प्रथाएं");

      const md2 = "## राजस्थान के प्रमुख लोक नृत्य \n\n1. Question...";
      expect(detectTopicFromMarkdown(md2, "test.md")).toBe("राजस्थान के प्रमुख लोक नृत्य");

      const md3 = "No heading here\n1. Question...";
      expect(detectTopicFromMarkdown(md3, "rajasthan-forts.md")).toBe("rajasthan-forts");
    });
  });

  describe("2. Question Format Detection", () => {
    it("detects Matching format", () => {
      const q = "सूची-I को सूची-II से सुमेलित कीजिए:";
      expect(detectQuestionFormat(q, ["A-1, B-2", "A-2, B-1"])).toBe("Matching");
    });

    it("detects Statement format", () => {
      const q = "निम्न कथनों पर विचार कीजिए: कथन 1: ... कथन 2: ...";
      expect(detectQuestionFormat(q, ["केवल 1", "केवल 2", "1 और 2 दोनों", "कोई नहीं"])).toBe("Statement");
    });

    it("detects Assertion-Reason format", () => {
      const q = "कथन (A): हवामहल जयपुर में स्थित है। कारण (R): इसका निर्माण सवाई प्रताप सिंह ने करवाया था।";
      expect(detectQuestionFormat(q, ["A और R दोनों सही हैं"])).toBe("AssertionReason");
    });

    it("detects Normal MCQ format", () => {
      const q = "राजस्थान का राज्य पक्षी कौनसा है?";
      expect(detectQuestionFormat(q, ["गोडावण", "मोर", "तोता", "कबूतर"])).toBe("MCQ");
    });
  });

  describe("3. Answer Key & Exam/Year Parsing", () => {
    it("maps varied answer keys to 0-indexed integers", () => {
      expect(parseAnswerKeyToOptionIndex("A")).toBe(0);
      expect(parseAnswerKeyToOptionIndex("(b)")).toBe(1);
      expect(parseAnswerKeyToOptionIndex("3")).toBe(2);
      expect(parseAnswerKeyToOptionIndex("द")).toBe(3);
      expect(parseAnswerKeyToOptionIndex("अ")).toBe(0);
      expect(parseAnswerKeyToOptionIndex("ख")).toBe(1);
      expect(parseAnswerKeyToOptionIndex("invalid")).toBeNull();
    });

    it("extracts Exam / Year tags from question text brackets and cleans text", () => {
      const text1 = "राजस्थान में 'कुकड़ी की रस्म' किस जनजाति में प्रचलित है- [Asst. Agriculture Officer 2018]";
      const res1 = extractExamYearTag(text1);
      expect(res1.examTag).toBe("Asst. Agriculture Officer 2018");
      expect(res1.cleanText).toBe("राजस्थान में 'कुकड़ी की रस्म' किस जनजाति में प्रचलित है-");

      const text2 = "1832 में कानून बनाकर दास प्रथा को समाप्त करने वाला गवर्नर जनरल कौन था-";
      const res2 = extractExamYearTag(text2);
      expect(res2.examTag).toBeNull();
      expect(res2.cleanText).toBe(text2);
    });
  });

  describe("4. Full Markdown Parsing & Verification", () => {
    const sampleMd = `# राजस्थान की प्रथाएं

1. राजस्थान में डाकन प्रथा पर सर्वप्रथम रोक कहाँ लगाई गई? [CET 2022]
(A) उदयपुर
(B) कोटा
(C) जयपुर
(D) जोधपुर
उत्तर- (A)
व्याख्या- 1853 में मेवाड़ (उदयपुर) में स्वरूप सिंह के काल में डाकन प्रथा पर रोक लगाई गई।

2. मौसर क्या है?
(A) विवाह भोज
(B) मृत्यु भोज
(C) जन्म संस्कार
(D) गृह प्रवेश
उत्तर- B
व्याख्या- राजस्थान में मृत्यु के अवसर पर दिया जाने वाला भोज मौसर कहलाता है।
`;

    it("parses sample markdown into structured verified questions", () => {
      const parsed = parseMarkdownQuestionFile(sampleMd, "/question-bank/newQuestions/rajasthan-art-and-culture/test.md");
      expect(parsed.subject).toBe("Rajasthan Art & Culture");
      expect(parsed.topic).toBe("राजस्थान की प्रथाएं");
      expect(parsed.questions.length).toBe(2);

      const q1 = parsed.questions[0];
      expect(q1.questionText).toContain("डाकन प्रथा");
      expect(q1.options.length).toBe(4);
      expect(q1.providedOptionIndex).toBe(0);
      expect(q1.providedExamTag).toBe("CET 2022");
      expect(q1.providedExplanation).toContain("स्वरूप सिंह");

      const q2 = parsed.questions[1];
      expect(q2.providedOptionIndex).toBe(1);
      expect(q2.providedExamTag).toBeNull();
    });

    it("cleans OCR artifacts and validates questions", () => {
      const rawText = "  राजस्थान   में  सती   प्रथा  | रोक   ";
      expect(cleanOcrArtifacts(rawText)).toBe("राजस्थान में सती प्रथा | रोक");
    });
  });

  describe("5. Seeder & Duplicate Protection", () => {
    const mockQuizId = new mongoose.Types.ObjectId();

    it("appends new questions to an existing topic bank and skips duplicates", async () => {
      const existingQuizDoc = {
        _id: mockQuizId,
        title: "राजस्थान की प्रथाएं",
        slug: "rajasthan-ki-prathayein",
        subject: "Rajasthan Art & Culture",
        examTags: ["CET 2022"],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.spyOn(Quiz, "findOne").mockResolvedValue(existingQuizDoc as any);

      // 1 existing question in DB
      const existingDbQuestion = {
        _id: new mongoose.Types.ObjectId(),
        quizId: mockQuizId,
        order: 1,
        questionText: "राजस्थान में डाकन प्रथा पर सर्वप्रथम रोक कहाँ लगाई गई?",
        options: ["उदयपुर", "कोटा", "जयपुर", "जोधपुर"],
        correctOptionIndex: 0,
      };

      vi.spyOn(QuizQuestion, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([existingDbQuestion]),
      } as any);

      const insertManySpy = vi.spyOn(QuizQuestion, "insertMany").mockResolvedValue([
        { _id: new mongoose.Types.ObjectId() },
      ] as any);

      // Attempt to seed 2 questions (1 duplicate, 1 new)
      const incomingQuestions = [
        {
          order: 1,
          questionText: "राजस्थान में डाकन प्रथा पर सर्वप्रथम रोक कहाँ लगाई गई?",
          options: ["उदयपुर", "कोटा", "जयपुर", "जोधपुर"],
          providedOptionIndex: 0,
          providedAnswerKey: "A",
          providedExamTag: "CET 2022",
          format: "MCQ" as const,
          verificationStatus: "VERIFIED" as const,
          fingerprint: "",
        },
        {
          order: 2,
          questionText: "मौसर क्या है?",
          options: ["विवाह भोज", "मृत्यु भोज", "जन्म संस्कार", "गृह प्रवेश"],
          providedOptionIndex: 1,
          providedAnswerKey: "B",
          providedExamTag: null,
          format: "MCQ" as const,
          verificationStatus: "VERIFIED" as const,
          fingerprint: "",
        },
      ];

      const seedResult = await seedQuestionsToTopicBank(
        "Rajasthan Art & Culture",
        "राजस्थान की प्रथाएं",
        incomingQuestions as any
      );

      expect(seedResult.duplicateCount).toBe(1);
      expect(seedResult.importedCount).toBe(1);
      expect(seedResult.totalNowInBank).toBe(2);
      expect(insertManySpy).toHaveBeenCalledTimes(1);

      // Verify appended question gets order: 2
      const insertedPayload = insertManySpy.mock.calls[0][0] as any[];
      expect(insertedPayload[0].order).toBe(2);
      expect(insertedPayload[0].questionText).toBe("मौसर क्या है?");
    });
  });

  describe("6. Safe Local File Cleanup Invariant", () => {
    it("deletes local file in live mode when 100% of questions are verified & seeded with 0 review flags", async () => {
      const mockFilePath = "question-bank/newQuestions/rajasthan-art-and-culture/clean-test.md";

      const validContent = `# राजस्थान की प्रथाएं

1. मौसर क्या है?
(A) विवाह भोज
(B) मृत्यु भोज
(C) जन्म संस्कार
(D) गृह प्रवेश
उत्तर- B
व्याख्या- मृत्यु भोज
`;

      vi.spyOn(fs, "readFileSync").mockReturnValue(validContent);
      const unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      vi.spyOn(Quiz, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        title: "राजस्थान की प्रथाएं",
        slug: "rajasthan-ki-prathayein",
        save: vi.fn().mockResolvedValue(true),
      } as any);

      vi.spyOn(QuizQuestion, "find").mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      } as any);

      vi.spyOn(QuizQuestion, "insertMany").mockResolvedValue([{ _id: new mongoose.Types.ObjectId() }] as any);

      const report = await QuestionBankAutomationEngine.processFile(mockFilePath, false);

      expect(report.totalFound).toBe(1);
      expect(report.importedCount).toBe(1);
      expect(report.reviewNeededCount).toBe(0);
      expect(report.fileDeleted).toBe(true);
      expect(unlinkSpy).toHaveBeenCalledWith(mockFilePath);
    });

    it("NEVER deletes local file if any question requires review or has parsing issues", async () => {
      const mockFilePath = "question-bank/newQuestions/rajasthan-art-and-culture/review-test.md";

      // Question with invalid option count (only 1 option)
      const invalidContent = `# राजस्थान की प्रथाएं

1. मौसर क्या है?
(A) विवाह भोज
उत्तर- B
`;

      vi.spyOn(fs, "readFileSync").mockReturnValue(invalidContent);
      const unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      const report = await QuestionBankAutomationEngine.processFile(mockFilePath, false);

      expect(report.fileDeleted).toBe(false);
      expect(unlinkSpy).not.toHaveBeenCalled();
    });

    it("NEVER deletes local file in dry-run mode", async () => {
      const mockFilePath = "question-bank/newQuestions/rajasthan-art-and-culture/dry-test.md";

      const validContent = `# राजस्थान की प्रथाएं

1. मौसर क्या है?
(A) विवाह भोज
(B) मृत्यु भोज
उत्तर- B
`;

      vi.spyOn(fs, "readFileSync").mockReturnValue(validContent);
      const unlinkSpy = vi.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      const report = await QuestionBankAutomationEngine.processFile(mockFilePath, true); // dryRun = true

      expect(report.fileDeleted).toBe(false);
      expect(unlinkSpy).not.toHaveBeenCalled();
    });
  });
});
