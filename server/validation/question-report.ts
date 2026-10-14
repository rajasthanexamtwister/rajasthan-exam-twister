import { z } from "zod";

export const QUESTION_ISSUE_REASONS = [
  "INCORRECT_ANSWER",
  "INCORRECT_QUESTION",
  "SPELLING_TYPO",
  "OPTIONS_INCORRECT",
  "OTHER",
] as const;

export type QuestionIssueReasonType = (typeof QUESTION_ISSUE_REASONS)[number];

export const REASON_CONFIG: Record<
  QuestionIssueReasonType,
  { label: string; hindiLabel: string; descriptionRequired: boolean }
> = {
  INCORRECT_ANSWER: {
    label: "Incorrect Answer",
    hindiLabel: "गलत उत्तर",
    descriptionRequired: false,
  },
  INCORRECT_QUESTION: {
    label: "Incorrect Question / Information",
    hindiLabel: "प्रश्न या जानकारी में त्रुटि",
    descriptionRequired: false,
  },
  SPELLING_TYPO: {
    label: "Spelling / Typing Error",
    hindiLabel: "वर्तनी या टाइपिंग त्रुटि",
    descriptionRequired: false,
  },
  OPTIONS_INCORRECT: {
    label: "Options Missing / Incorrect",
    hindiLabel: "विकल्प गायब या गलत",
    descriptionRequired: false,
  },
  OTHER: {
    label: "Other",
    hindiLabel: "अन्य समस्या",
    descriptionRequired: true,
  },
};

export const CreateQuestionReportSchema = z
  .object({
    reason: z.enum(QUESTION_ISSUE_REASONS, {
      required_error: "Please select an issue reason",
    }),
    description: z
      .string()
      .trim()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional()
      .default(""),
    quizSlug: z.string().trim().min(1, "Quiz slug is required"),
  })
  .superRefine((data, ctx) => {
    if (data.reason === "OTHER") {
      const trimmed = (data.description || "").trim();
      if (!trimmed || trimmed.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["description"],
          message: "Please describe the issue in detail (required for 'Other')",
        });
      }
    }
  });

export const UpdateQuestionReportStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "REJECTED"], {
    required_error: "Status is required",
  }),
  adminNotes: z.string().trim().max(2000).optional(),
});
