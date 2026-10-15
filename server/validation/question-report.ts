import { z } from "zod";

export const QUESTION_ISSUE_REASONS = [
  "INCORRECT_ANSWER",
  "INCORRECT_QUESTION",
  "OPTIONS_INCORRECT",
  "INCORRECT_EXPLANATION",
  "SPELLING_TYPO",
  "OTHER",
] as const;

export type QuestionIssueReasonType = (typeof QUESTION_ISSUE_REASONS)[number];

export const REASON_CONFIG: Record<
  QuestionIssueReasonType,
  { label: string; hindiLabel: string; descriptionRequired: boolean }
> = {
  INCORRECT_ANSWER: {
    label: "Incorrect Answer",
    hindiLabel: "गलत उत्तर (Wrong Answer)",
    descriptionRequired: false,
  },
  INCORRECT_QUESTION: {
    label: "Incorrect Question",
    hindiLabel: "प्रश्न में त्रुटि (Question Error)",
    descriptionRequired: false,
  },
  OPTIONS_INCORRECT: {
    label: "Wrong Options",
    hindiLabel: "विकल्प में त्रुटि (Wrong / Missing Options)",
    descriptionRequired: false,
  },
  INCORRECT_EXPLANATION: {
    label: "Incorrect Explanation",
    hindiLabel: "व्याख्या में त्रुटि (Wrong Explanation)",
    descriptionRequired: false,
  },
  SPELLING_TYPO: {
    label: "Typo / Formatting",
    hindiLabel: "टाइपिंग / प्रारूप त्रुटि (Typo / Formatting)",
    descriptionRequired: false,
  },
  OTHER: {
    label: "Other",
    hindiLabel: "अन्य समस्या (Other Issue)",
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

export const QUESTION_REPORT_STATUSES = [
  "PENDING",
  "UNDER_REVIEW",
  "RESOLVED",
  "REJECTED",
  "REVIEWED", // kept for backwards compatibility
] as const;

export const UpdateQuestionReportStatusSchema = z.object({
  status: z.enum(QUESTION_REPORT_STATUSES, {
    required_error: "Status is required",
  }),
  adminNotes: z.string().trim().max(3000).optional(),
  assignedTo: z.string().trim().max(200).optional().nullable(),
  evidenceSource: z.string().trim().max(1000).optional().nullable(),
  resolutionReason: z.string().trim().max(1000).optional().nullable(),
  studentFeedback: z.string().trim().max(1000).optional().nullable(),
});

export const CorrectQuestionSchema = z
  .object({
    questionText: z.string().trim().min(3, "Question text must be at least 3 characters"),
    questionTextEn: z.string().trim().optional(),
    options: z
      .array(z.string().trim().min(1, "Option text cannot be empty"))
      .min(2, "At least 2 options are required")
      .max(6, "Cannot exceed 6 options"),
    optionsEn: z.array(z.string().trim()).optional(),
    correctOptionIndex: z.number().int().min(0, "Correct option index must be non-negative"),
    explanation: z.string().trim().optional().default(""),
    evidenceSource: z
      .string()
      .trim()
      .min(3, "Evidence source / reference is required for audit verification"),
    changeReason: z
      .string()
      .trim()
      .min(3, "Change reason / justification is required"),
    studentFeedback: z.string().trim().max(1000).optional(),
    adminNotes: z.string().trim().max(3000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.correctOptionIndex >= data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctOptionIndex"],
        message: `Correct option index ${data.correctOptionIndex} is out of bounds for ${data.options.length} options`,
      });
    }
  });
