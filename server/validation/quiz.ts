import { z } from "zod";

// Helper to strip any HTML tags and collapse whitespace to plain text
export function sanitizePlainText(str: string): string {
  if (!str) return "";
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip <script> and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")   // Strip <style> and content
    .replace(/<[^>]*>/g, "") // Strip all HTML tags
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
}

// Single Question in JSON Import
export const QuizImportQuestionSchema = z
  .object({
    questionText: z
      .string()
      .min(1, "Question text cannot be empty")
      .max(2000, "Question text cannot exceed 2000 characters"),
    questionTextEn: z
      .string()
      .max(2000, "English question text cannot exceed 2000 characters")
      .optional(),
    options: z
      .array(
        z
          .string()
          .min(1, "Option text cannot be empty")
          .max(500, "Option text cannot exceed 500 characters")
      )
      .min(2, "Each question must have at least 2 options")
      .max(6, "Each question cannot have more than 6 options"),
    optionsEn: z
      .array(
        z
          .string()
          .min(1, "English option text cannot be empty")
          .max(500, "English option text cannot exceed 500 characters")
      )
      .min(2, "English options must have at least 2 options")
      .max(6, "English options cannot have more than 6 options")
      .optional(),
    correctOptionIndex: z
      .number({ invalid_type_error: "correctOptionIndex must be a number" })
      .int("correctOptionIndex must be an integer")
      .min(0, "correctOptionIndex must be 0 or greater"),
    explanation: z
      .string()
      .max(2000, "Explanation cannot exceed 2000 characters")
      .optional()
      .default(""),
    marks: z
      .number()
      .positive("Marks must be greater than 0")
      .optional(),
    negativeMarks: z
      .number()
      .min(0, "Negative marks cannot be less than 0")
      .optional(),
  })
  .refine(
    (data) => data.correctOptionIndex < data.options.length,
    {
      message: "correctOptionIndex must be less than options.length",
      path: ["correctOptionIndex"],
    }
  )
  .refine(
    (data) => !data.optionsEn || data.optionsEn.length === data.options.length,
    {
      message: "optionsEn must have the exact same number of options as options",
      path: ["optionsEn"],
    }
  );

// Full JSON Import Schema
export const QuizImportJSONSchema = z.object({
  quizTitle: z
    .string()
    .min(1, "Quiz title cannot be empty")
    .max(200, "Quiz title cannot exceed 200 characters"),
  subject: z
    .string()
    .max(100, "Subject cannot exceed 100 characters")
    .optional(),
  examTags: z
    .array(z.string().min(1).max(50))
    .max(20, "Cannot exceed 20 exam tags")
    .optional()
    .default([]),
  difficulty: z
    .enum(["easy", "medium", "hard"])
    .optional()
    .default("medium"),
  questions: z
    .array(QuizImportQuestionSchema)
    .min(1, "At least 1 question is required")
    .max(300, "Maximum limit of 300 questions exceeded per quiz file"),
});

export type QuizImportJSON = z.infer<typeof QuizImportJSONSchema>;
export type QuizImportQuestion = z.infer<typeof QuizImportQuestionSchema>;

// Update Settings Schema (Admin)
export const UpdateQuizSettingsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subject: z.string().max(100).optional(),
  categoryId: z.string().nullable().optional(),
  examTags: z.array(z.string().min(1).max(50)).max(20).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  timeLimitSeconds: z.number().int().min(10).nullable().optional(),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  maxAttempts: z.number().int().min(1).nullable().optional(),
  defaultMarks: z.number().positive().optional(),
  defaultNegativeMarks: z.number().min(0).optional(),
});

export type UpdateQuizSettingsInput = z.infer<typeof UpdateQuizSettingsSchema>;

// Inline Edit Single Question (Admin)
export const UpdateQuizQuestionSchema = z
  .object({
    questionText: z.string().min(1).max(2000).optional(),
    questionTextEn: z.string().max(2000).optional(),
    options: z
      .array(z.string().min(1).max(500))
      .min(2)
      .max(6)
      .optional(),
    optionsEn: z
      .array(z.string().min(1).max(500))
      .min(2)
      .max(6)
      .optional(),
    correctOptionIndex: z.number().int().min(0).optional(),
    explanation: z.string().max(2000).optional(),
    marks: z.number().positive().nullable().optional(),
    negativeMarks: z.number().min(0).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.options !== undefined && data.correctOptionIndex !== undefined) {
        return data.correctOptionIndex < data.options.length;
      }
      return true;
    },
    {
      message: "correctOptionIndex must be within options range",
      path: ["correctOptionIndex"],
    }
  )
  .refine(
    (data) => {
      if (data.options !== undefined && data.optionsEn !== undefined) {
        return data.optionsEn.length === data.options.length;
      }
      return true;
    },
    {
      message: "optionsEn must match options length",
      path: ["optionsEn"],
    }
  );

export type UpdateQuizQuestionInput = z.infer<typeof UpdateQuizQuestionSchema>;

// Submit Attempt Schema (Public)
export const SubmitQuizAttemptSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1, "Question ID is required"),
      selectedOptionIndex: z.number().int().min(0).nullable(),
    })
  ),
  startedAt: z.string().datetime().optional(),
});

export type SubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptSchema>;

// Query Quizzes Schema
export const QuizQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).optional(),
  subject: z.string().optional(),
  categoryId: z.string().optional(),
  examTag: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type QuizQueryInput = z.infer<typeof QuizQuerySchema>;
