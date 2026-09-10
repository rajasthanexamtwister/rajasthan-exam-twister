import { describe, it, expect } from "vitest";
import {
  QuizImportJSONSchema,
  QuizImportQuestionSchema,
  sanitizePlainText,
  UpdateQuizSettingsSchema,
  UpdateQuizQuestionSchema,
  SubmitQuizAttemptSchema,
} from "@/server/validation/quiz";

describe("Quiz Schema & Validation", () => {
  describe("QuizImportJSONSchema", () => {
    it("accepts a valid quiz JSON object matching the spec", () => {
      const validPayload = {
        quizTitle: "Rajasthan History Master Mock 1",
        subject: "Rajasthan GK",
        questions: [
          {
            questionText: "Who built the Vijay Stambha at Chittorgarh?",
            options: ["Rana Kumbha", "Rana Sanga", "Rana Pratap", "Rao Jodha"],
            correctOptionIndex: 0,
            explanation: "Vijay Stambha was built by Maharana Kumbha to commemorate his victory over Mahmud Khilji.",
            marks: 1,
            negativeMarks: 0.33,
          },
          {
            questionText: "In which year was the state of Rajasthan formed?",
            options: ["1947", "1948", "1949", "1950"],
            correctOptionIndex: 2,
            explanation: "Greater Rajasthan was formed on 30 March 1949.",
            marks: 2,
            negativeMarks: 0.66,
          },
        ],
      };

      const result = QuizImportJSONSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quizTitle).toBe("Rajasthan History Master Mock 1");
        expect(result.data.questions).toHaveLength(2);
      }
    });

    it("rejects JSON missing quizTitle or with empty quizTitle", () => {
      const missingTitle = {
        questions: [
          {
            questionText: "Sample question?",
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        ],
      };

      const emptyTitle = {
        quizTitle: "",
        questions: [
          {
            questionText: "Sample question?",
            options: ["A", "B"],
            correctOptionIndex: 0,
          },
        ],
      };

      expect(QuizImportJSONSchema.safeParse(missingTitle).success).toBe(false);
      expect(QuizImportJSONSchema.safeParse(emptyTitle).success).toBe(false);
    });

    it("rejects empty questions array or questions exceeding 300 items hard cap", () => {
      const emptyQuestions = {
        quizTitle: "Empty Quiz",
        questions: [],
      };
      expect(QuizImportJSONSchema.safeParse(emptyQuestions).success).toBe(false);

      const tooManyQuestions = {
        quizTitle: "Mega Quiz",
        questions: Array.from({ length: 301 }, (_, i) => ({
          questionText: `Question ${i + 1}?`,
          options: ["Option 1", "Option 2"],
          correctOptionIndex: 0,
        })),
      };
      const result = QuizImportJSONSchema.safeParse(tooManyQuestions);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Maximum limit of 300 questions exceeded");
      }
    });

    it("rejects correctOptionIndex out of range (< 0 or >= options.length)", () => {
      const outOfBoundsHigh = {
        questionText: "Where is Hawa Mahal located?",
        options: ["Jaipur", "Jodhpur", "Kota", "Bikaner"], // length 4 (indices 0..3)
        correctOptionIndex: 4, // out of range!
      };

      const outOfBoundsNegative = {
        questionText: "Where is Hawa Mahal located?",
        options: ["Jaipur", "Jodhpur", "Kota", "Bikaner"],
        correctOptionIndex: -1,
      };

      expect(QuizImportQuestionSchema.safeParse(outOfBoundsHigh).success).toBe(false);
      expect(QuizImportQuestionSchema.safeParse(outOfBoundsNegative).success).toBe(false);
    });

    it("rejects question with less than 2 or more than 6 options", () => {
      const singleOption = {
        questionText: "Invalid MCQ?",
        options: ["Only one option"],
        correctOptionIndex: 0,
      };

      const sevenOptions = {
        questionText: "Too many options?",
        options: ["1", "2", "3", "4", "5", "6", "7"],
        correctOptionIndex: 0,
      };

      expect(QuizImportQuestionSchema.safeParse(singleOption).success).toBe(false);
      expect(QuizImportQuestionSchema.safeParse(sevenOptions).success).toBe(false);
    });
  });

  describe("sanitizePlainText Helper", () => {
    it("strips all HTML tags and leaves clean plain text", () => {
      const rawWithHtml = `<script>alert('xss')</script><b>Which</b> fort is known as <span style="color:red">Golden Fort</span>?`;
      const cleaned = sanitizePlainText(rawWithHtml);
      expect(cleaned).not.toContain("<script>");
      expect(cleaned).not.toContain("<b>");
      expect(cleaned).not.toContain("<span");
      expect(cleaned).toContain("Which fort is known as Golden Fort?");
    });

    it("unescapes basic HTML entities cleanly", () => {
      const entityStr = "Rajasthan &amp; Mewar &lt;history&gt; &quot;notes&quot;";
      const cleaned = sanitizePlainText(entityStr);
      expect(cleaned).toBe('Rajasthan & Mewar <history> "notes"');
    });
  });

  describe("SubmitQuizAttemptSchema", () => {
    it("accepts valid attempt answers payload with nulls for unattempted", () => {
      const payload = {
        answers: [
          { questionId: "64f1a2b3c4d5e6f7a8b9c0d1", selectedOptionIndex: 1 },
          { questionId: "64f1a2b3c4d5e6f7a8b9c0d2", selectedOptionIndex: 0 },
          { questionId: "64f1a2b3c4d5e6f7a8b9c0d3", selectedOptionIndex: null }, // unattempted
        ],
        startedAt: new Date().toISOString(),
      };

      const result = SubmitQuizAttemptSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it("rejects attempt with empty questionId", () => {
      const invalid = {
        answers: [{ questionId: "", selectedOptionIndex: 0 }],
      };
      expect(SubmitQuizAttemptSchema.safeParse(invalid).success).toBe(false);
    });
  });
});
