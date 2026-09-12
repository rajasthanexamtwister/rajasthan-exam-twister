import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  stripCommentsAndJsWrappers,
  parseJsonTolerant,
  cleanOptionText,
  extractQuestionText,
  extractBilingualQuestionText,
  extractBilingualOptions,
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
    it("strips standard single option prefixes cleanly when safe", () => {
      expect(cleanOptionText("(a) Data Definition Language")).toBe("Data Definition Language");
      expect(cleanOptionText("B. Implementation", "B")).toBe("Implementation");
      expect(cleanOptionText("(1) Som River")).toBe("Som River");
      expect(cleanOptionText("D) All of the above", "D")).toBe("All of the above");
      expect(cleanOptionText("Normal Option Text")).toBe("Normal Option Text");
    });

    it("safely protects compound statement combinations from truncation", () => {
      expect(cleanOptionText("(1) and (2)", "A")).toBe("(1) and (2)");
      expect(cleanOptionText("(a), (b) and (d) only", "A")).toBe("(a), (b) and (d) only");
      expect(cleanOptionText("i and ii", "A")).toBe("i and ii");
      expect(cleanOptionText("(A) और (B) दोनों सही हैं", "A")).toBe("(A) और (B) दोनों सही हैं");
      expect(cleanOptionText("(A) is false but (R) is true.", "A")).toBe("(A) is false but (R) is true.");
      expect(cleanOptionText("-3/5")).toBe("-3/5");
      expect(cleanOptionText("1 Gbps")).toBe("1 Gbps");
    });
  });

  describe("extractQuestionText & extractBilingualQuestionText", () => {
    it("prioritizes Hindi field over English per site convention", () => {
      const q = {
        question_hindi: "राजस्थान की राजधानी क्या है?",
        question_english: "What is the capital of Rajasthan?",
      };
      expect(extractQuestionText(q)).toBe("राजस्थान की राजधानी क्या है?");
      const bilingual = extractBilingualQuestionText(q);
      expect(bilingual.questionText).toBe("राजस्थान की राजधानी क्या है?");
      expect(bilingual.questionTextEn).toBe("What is the capital of Rajasthan?");
    });

    it("extracts Hindi line from newline-separated bilingual question field and English line to questionTextEn", () => {
      const q = {
        question: "Which of the following is correct?\nनिम्नलिखित में से कौन-सा कथन सही है?",
      };
      expect(extractQuestionText(q)).toBe("निम्नलिखित में से कौन-सा कथन सही है?");
      const bilingual = extractBilingualQuestionText(q);
      expect(bilingual.questionText).toBe("निम्नलिखित में से कौन-सा कथन सही है?");
      expect(bilingual.questionTextEn).toBe("Which of the following is correct?");
    });

    it("falls back to English when no Hindi is present and avoids duplicate questionTextEn", () => {
      const q = {
        question_english: "What is ANSI/SPARC architecture?",
      };
      expect(extractQuestionText(q)).toBe("What is ANSI/SPARC architecture?");
      const bilingual = extractBilingualQuestionText(q);
      expect(bilingual.questionText).toBe("What is ANSI/SPARC architecture?");
      expect(bilingual.questionTextEn).toBeUndefined();
    });
  });

  describe("extractBilingualOptions", () => {
    it("extracts bilingual options from { hi, en } objects", () => {
      const rawOptions = [
        { id: "A", hi: "सोम नदी", en: "Som River" },
        { id: "B", hi: "माही नदी", en: "Mahi River" },
        { id: "C", hi: "जाखम नदी", en: "Jakham River" },
        { id: "D", hi: "चंबल नदी", en: "Chambal River" },
      ];

      const res = extractBilingualOptions(rawOptions);
      expect(res.options).toEqual(["सोम नदी", "माही नदी", "जाखम नदी", "चंबल नदी"]);
      expect(res.optionsEn).toEqual(["Som River", "Mahi River", "Jakham River", "Chambal River"]);
    });

    it("extracts bilingual options from slash-separated 'Hindi / English' strings", () => {
      const rawOptions = [
        "(a) वेबसाइट / Website",
        "(b) वेब ब्राउज़र / Web Browser",
        "(c) वेब सर्वर / Web Server",
        "(d) वेब पेज / Web Page",
      ];

      const res = extractBilingualOptions(rawOptions);
      expect(res.options).toEqual(["वेबसाइट", "वेब ब्राउज़र", "वेब सर्वर", "वेब पेज"]);
      expect(res.optionsEn).toEqual(["Website", "Web Browser", "Web Server", "Web Page"]);
    });

    it("splits on the LAST slash only when string contains multiple slashes", () => {
      const rawOptions = [
        "(a) 10/100 एमबीपीएस / 100 Mbps",
        "(b) 1 जीबीपीएस / 1 Gbps",
      ];

      const res = extractBilingualOptions(rawOptions);
      expect(res.options).toEqual(["10/100 एमबीपीएस", "1 जीबीपीएस"]);
      expect(res.optionsEn).toEqual(["100 Mbps", "1 Gbps"]);
    });

    it("conservatively leaves options as-is and omits optionsEn if any option is ambiguous or lacks English", () => {
      const rawOptions = [
        "24/7 सेवा", // Not Devanagari / Latin split
        "वेबसाइट / Website",
      ];

      const res = extractBilingualOptions(rawOptions);
      expect(res.options).toEqual(["24/7 सेवा", "वेबसाइट / Website"]);
      expect(res.optionsEn).toBeUndefined();
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
    it("successfully converts valid raw question object and populates bilingual fields", () => {
      const rawQ = {
        id: "BCI-001",
        question_hindi: "डीडीएल का पूर्ण रूप क्या है?",
        question_english: "What is the full form of DDL?",
        options: ["(a) डेटा डेफ़िनिशन / Data Definition", "(b) डेटा डिस्क्रिप्शन / Data Description"],
        correct_answer: "A",
        explanation: "DDL defines database layout.",
      };

      const res = convertSingleQuestion(rawQ, 0);
      expect(res.issue).toBeUndefined();
      expect(res.question).toBeDefined();
      expect(res.question?.questionText).toBe("डीडीएल का पूर्ण रूप क्या है?");
      expect(res.question?.questionTextEn).toBe("What is the full form of DDL?");
      expect(res.question?.options).toEqual(["डेटा डेफ़िनिशन", "डेटा डिस्क्रिप्शन"]);
      expect(res.question?.optionsEn).toEqual(["Data Definition", "Data Description"]);
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
