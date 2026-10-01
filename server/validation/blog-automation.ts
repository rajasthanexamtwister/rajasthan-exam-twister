import { z } from "zod";

export const AutomationArticleTypeSchema = z.enum([
  "RAJASTHAN_GK",
  "CURRENT_AFFAIRS",
  "EXAM_UPDATES",
  "STATIC_GK",
  "STUDY_GUIDE",
]);

export const GenerationStatusSchema = z.enum([
  "DISCOVERED",
  "RESEARCHING",
  "RESEARCHED",
  "GENERATING",
  "GENERATED",
  "QA_RUNNING",
  "QA_PASSED",
  "QA_FAILED",
  "DRAFT_CREATED",
  "FAILED",
]);

export const ScheduleStatusSchema = z.enum([
  "UNSCHEDULED",
  "QUEUED",
  "SCHEDULED",
  "PROCESSING",
  "PUBLISHED",
  "CANCELLED",
  "HOLD",
  "FAILED",
]);

export const ResearchSourcePayloadSchema = z.object({
  url: z.string().url(),
  title: z.string().min(1),
  publisher: z.string().optional(),
  publishDate: z.string().or(z.date()).optional(),
  snippet: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  isOfficial: z.boolean().default(false),
});

export const SeoBriefPayloadSchema = z.object({
  focusKeywords: z.array(z.string()).default([]),
  secondaryKeywords: z.array(z.string()).default([]),
  searchIntent: z.string().optional(),
  metaTitleSuggestion: z.string().max(100).optional(),
  metaDescriptionSuggestion: z.string().max(250).optional(),
});

export const InternalLinkPayloadSchema = z.object({
  anchorText: z.string().min(1),
  targetSlug: z.string().min(1),
  reason: z.string().optional(),
});

export const FaqItemPayloadSchema = z.object({
  question: z.string().min(3),
  answer: z.string().min(3),
});

export const McqItemPayloadSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.number().int().min(0),
  explanation: z.string().default(""),
});

export const ResearchPayloadSchema = z.object({
  sources: z.array(ResearchSourcePayloadSchema).default([]),
  verifiedClaims: z.array(z.string()).default([]),
  uncertainClaims: z.array(z.string()).default([]),
  conflictingClaims: z.array(z.string()).default([]),
  seoBrief: SeoBriefPayloadSchema.optional(),
  internalLinks: z.array(InternalLinkPayloadSchema).default([]),
  faqs: z.array(FaqItemPayloadSchema).default([]),
  mcqs: z.array(McqItemPayloadSchema).default([]),
  eventDate: z.string().or(z.date()).optional(),
  researchDate: z.string().or(z.date()).optional(),
  lastVerifiedAt: z.string().or(z.date()).optional(),
  model: z.string().default("gemini-1.5-pro"),
  generatedBy: z.string().default("rajasthan_exam_blogs"),
});

export const QaResultPayloadSchema = z.object({
  score: z.number().min(0).max(100).default(85),
  status: z.enum(["PASSED", "FAILED"]).default("PASSED"),
  checks: z.record(z.boolean()).optional(),
  warnings: z.array(z.string()).default([]),
  evaluatedAt: z.string().or(z.date()).optional(),
});

export const ImageMetadataPayloadSchema = z.object({
  imageUrl: z.string().url().optional(),
  prompt: z.string().optional(),
  altText: z.string().optional(),
  caption: z.string().optional(),
  status: z.enum(["PENDING", "GENERATING", "READY", "FAILED", "SKIPPED"]).default("READY"),
});

// Full incoming AI engine article payload
export const AiArticlePayloadSchema = z.object({
  externalJobId: z.string().min(1),
  topic: z.string().min(3),
  articleType: AutomationArticleTypeSchema.default("RAJASTHAN_GK"),
  title: z.string().min(5).max(300),
  slug: z.string().min(2).max(200).optional(),
  excerpt: z.string().max(1000).optional(),
  contentHtml: z.string().min(30),
  category: z.string().min(1).default("Rajasthan GK"),
  tags: z.array(z.string()).default([]),
  metaTitle: z.string().max(100).optional(),
  metaDescription: z.string().max(300).optional(),
  canonicalUrl: z.string().url().optional(),
  author: z.string().default("Rajasthan Exam Twister AI Editorial"),
  featured: z.boolean().default(false),
  research: ResearchPayloadSchema.default({
    sources: [],
    verifiedClaims: [],
    uncertainClaims: [],
    conflictingClaims: [],
    internalLinks: [],
    faqs: [],
    mcqs: [],
  }),
  qa: QaResultPayloadSchema.default({
    score: 85,
    status: "PASSED",
    warnings: [],
  }),
  image: ImageMetadataPayloadSchema.optional(),
  isCurrentAffairs: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

export type AiArticlePayload = z.infer<typeof AiArticlePayloadSchema>;

// Batch generate input
export const BatchGenerateInputSchema = z.object({
  topics: z.array(z.string().min(2)).optional(),
  count: z.number().int().min(1).max(50).default(5),
  articleMix: z
    .object({
      rajasthanGk: z.number().int().min(0).default(2),
      currentAffairs: z.number().int().min(0).default(1),
      examUpdates: z.number().int().min(0).default(1),
      staticGk: z.number().int().min(0).default(1),
      studyGuide: z.number().int().min(0).default(0),
    })
    .optional(),
  dryRun: z.boolean().default(false),
  requestedBy: z.string().default("Admin"),
});

export type BatchGenerateInput = z.infer<typeof BatchGenerateInputSchema>;

// Topic discovery input
export const DiscoverTopicsInputSchema = z.object({
  category: z.string().optional(),
  articleType: AutomationArticleTypeSchema.optional(),
  count: z.number().int().min(1).max(50).default(10),
  keywords: z.array(z.string()).optional(),
});

export type DiscoverTopicsInput = z.infer<typeof DiscoverTopicsInputSchema>;

// Batch schedule input
export const BatchScheduleInputSchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1),
  startDate: z.string().min(1), // YYYY-MM-DD
  startTime: z.string().min(1), // HH:mm
  intervalHours: z.number().min(1).max(72).default(6),
  timezone: z.string().default("Asia/Kolkata"),
});

export type BatchScheduleInput = z.infer<typeof BatchScheduleInputSchema>;

// Queue item mutation input
export const UpdateQueueItemInputSchema = z.object({
  action: z.enum(["APPROVE", "HOLD", "CANCEL", "SCHEDULE", "RETRY", "VERIFY_FRESH"]).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  timezone: z.string().optional(),
  adminApproved: z.boolean().optional(),
  notes: z.string().optional(),
});

export type UpdateQueueItemInput = z.infer<typeof UpdateQueueItemInputSchema>;

// Queue query options
export const QueueFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  scheduleStatus: ScheduleStatusSchema.optional(),
  generationStatus: GenerationStatusSchema.optional(),
  articleType: AutomationArticleTypeSchema.optional(),
  search: z.string().optional(),
  requiresApproval: z.coerce.boolean().optional(),
});

export type QueueFilterQuery = z.infer<typeof QueueFilterQuerySchema>;
