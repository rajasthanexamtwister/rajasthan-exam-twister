import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  stripCommentsAndJsWrappers,
  parseJsonTolerant,
  cleanOptionText,
  extractQuestionText,
  resolveCorrectOptionIndex,
  convertSingleQuestion,
  convertQuestionBankDirectory,
} from "@/scripts/convert-question-bank";

describe("Question Bank Adapter Converter (scripts/convert-question-bank.ts)", () => {
  let tempDir: string;
  let inDir: string;
  let outDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "conv-test-"));
    inDir = path.join(tempDir, "in");
    outDir = path.join(tempDir, "out");
    fs.mkdirSync(inDir);
    fs.mkdirSync(outDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("stripCommentsAndJsWrappers & parseJsonTolerant", () => {
    it("handles JavaScript comment lines and variable declarations", () => {
      const jsContent = `// BCI NoSQL Question Bank
const questions = [
  {
    "id": 1,
    "question": "Sample Question",
    "options": ["A", "B"],
    "correct_answer": "A"
  }
];`;

      const res = parseJsonTolerant(jsContent);
      expect(res.hadCommentsOrJs).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data[0].id).toBe(1);
    });

    it("parses standard valid JSON without comment stripping flag", () => {
      const jsonContent = `[{"id": 10, "text": "Valid"}]`;
      const res = parseJsonTolerant(jsonContent);
      expect(res.hadCommentsOrJs).toBe(false);
      expect(res.data[0].id).toBe(10);
    });
  });

  describe("cleanOptionText", () => {
    it("strips various option prefixes cleanly", () => {
      expect(cleanOptionText("(a) Data Definition Language")).toBe("Data Definition Language");
      expect(cleanOptionText("B. Implementation")).toBe("Implementation");
      expect(cleanOptionText("(1) Som River")).toBe("Som River");
      expect(cleanOptionText("D) All of the above")).toBe("All of the above");
      expect(cleanOptionText("Normal Option Text")).toBe("Normal Option Text");
    });
  });

  describe("extractQuestionText", () => {
    it("prioritizes Hindi field over English per site convention", () => {
      const q = {
        question_hindi: "राजस्थान की राजधानी क्या है?",
        question_english: "What is the capital of Rajasthan?",
      };
      expect(extractQuestionText(q)).toBe("राजस्थान की राजधानी क्या है?");
    });

    it("extracts Hindi line from newline-separated bilingual question field", () => {
      const q = {
        question: "Which of the following is correct?\nनिम्नलिखित में से कौन-सा कथन सही है?",
      };
      expect(extractQuestionText(q)).toBe("निम्नलिखित में से कौन-सा कथन सही है?");
    });

    it("falls back to English when no Hindi is present", () => {
      const q = {
        question_english: "What is ANSI/SPARC architecture?",
      };
      expect(extractQuestionText(q)).toBe("What is ANSI/SPARC architecture?");
    });
  });

  describe("resolveCorrectOptionIndex", () => {
    const cleanOpts = ["Internal", "Implementation", "Conceptual", "External"];
    const rawOpts = ["(a) Internal", "(b) Implementation", "(c) Conceptual", "(d) External"];

    it("resolves direct letter answers", () => {
      expect(resolveCorrectOptionIndex("A", cleanOpts, rawOpts)).toBe(0);
      expect(resolveCorrectOptionIndex("b", cleanOpts, rawOpts)).toBe(1);
      expect(resolveCorrectOptionIndex("(c)", cleanOpts, rawOpts)).toBe(2);
      expect(resolveCorrectOptionIndex("D.", cleanOpts, rawOpts)).toBe(3);
    });

    it("resolves prefixed answer strings", () => {
      expect(resolveCorrectOptionIndex("(b) Implementation", cleanOpts, rawOpts)).toBe(1);
      expect(resolveCorrectOptionIndex("A. Internal", cleanOpts, rawOpts)).toBe(0);
    });

    it("resolves object option id match", () => {
      const objectOptions = [
        { id: "A", text: "Alpha" },
        { id: "B", text: "Beta" },
        { id: "C", text: "Gamma" },
      ];
      expect(resolveCorrectOptionIndex("B", ["Alpha", "Beta", "Gamma"], objectOptions)).toBe(1);
    });

    it("returns null for unresolved out-of-range or missing answers without guessing", () => {
      expect(resolveCorrectOptionIndex("Z", cleanOpts, rawOpts)).toBe(null);
      expect(resolveCorrectOptionIndex("E", cleanOpts, rawOpts)).toBe(null); // only 4 options
      expect(resolveCorrectOptionIndex(undefined, cleanOpts, rawOpts)).toBe(null);
      expect(resolveCorrectOptionIndex("", cleanOpts, rawOpts)).toBe(null);
    });
  });

  describe("convertSingleQuestion", () => {
    it("successfully converts valid raw question object", () => {
      const rawQ = {
        id: "BCI-001",
        question_hindi: "डीडीएल का पूर्ण रूप क्या है?",
        options: ["(a) Data Definition Language", "(b) Data Description Language"],
        correct_answer: "A",
        explanation: "DDL defines database layout.",
      };

      const res = convertSingleQuestion(rawQ, 0);
      expect(res.issue).toBeUndefined();
      expect(res.question).toBeDefined();
      expect(res.question?.questionText).toBe("डीडीएल का पूर्ण रूप क्या है?");
      expect(res.question?.options).toEqual(["Data Definition Language", "Data Description Language"]);
      expect(res.question?.correctOptionIndex).toBe(0);
      expect(res.question?.explanation).toBe("DDL defines database layout.");
    });

    it("returns an issue if answer key is unresolvable", () => {
      const rawQ = {
        id: "BCI-002",
        question_hindi: "प्रश्न संख्या २",
        options: ["(a) Option 1", "(b) Option 2"],
        correct_answer: "Z",
      };

      const res = convertSingleQuestion(rawQ, 1);
      expect(res.question).toBeUndefined();
      expect(res.issue).toBeDefined();
      expect(res.issue?.reason).toContain("Unresolved correct_answer key: 'Z'");
    });
  });

  describe("convertQuestionBankDirectory", () => {
    it("converts raw files in source directory and writes valid QuizImportJSON to destination", async () => {
      const sampleFileContent = [
        {
          id: "Q1",
          question_hindi: "राजस्थान का राज्य वृक्ष कौनसा है?",
          options: ["(a) खेजड़ी", "(b) रोहिड़ा", "(c) नीम", "(d) बबूल"],
          correct_answer: "A",
          explanation: "खेजड़ी (Prosopis cineraria) राजस्थान का राज्य वृक्ष है।",
        },
        {
          id: "Q2",
          question_hindi: "राजस्थान का राज्य पुष्प कौनसा है?",
          options: ["(a) रोहिड़ा", "(b) कमल", "(c) गुलाब", "(d) गेंदा"],
          correct_answer: "(a) रोहिड़ा",
        },
      ];

      fs.writeFileSync(path.join(inDir, "rajasthan-gk-basics.json"), JSON.stringify(sampleFileContent));

      const summary = await convertQuestionBankDirectory(inDir, outDir);

      expect(summary.totalFilesScanned).toBe(1);
      expect(summary.convertedFilesCount).toBe(1);
      expect(summary.totalQuestionsConverted).toBe(2);
      expect(summary.totalQuestionsExcluded).toBe(0);

      // Verify output file exists in outDir
      const outFiles = fs.readdirSync(outDir);
      expect(outFiles).toHaveLength(1);

      const convertedContent = JSON.parse(fs.readFileSync(path.join(outDir, outFiles[0]), "utf-8"));
      expect(convertedContent.quizTitle).toBe("Rajasthan GK Basics");
      expect(convertedContent.questions).toHaveLength(2);
      expect(convertedContent.questions[0].correctOptionIndex).toBe(0);
      expect(convertedContent.questions[0].options[0]).toBe("खेजड़ी");
    });
  });
});
