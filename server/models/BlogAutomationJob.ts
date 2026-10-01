import mongoose, { Schema, Document, Model } from "mongoose";

export type AutomationArticleType =
  | "RAJASTHAN_GK"
  | "CURRENT_AFFAIRS"
  | "EXAM_UPDATES"
  | "STATIC_GK"
  | "STUDY_GUIDE";

export type GenerationStatus =
  | "DISCOVERED"
  | "RESEARCHING"
  | "RESEARCHED"
  | "GENERATING"
  | "GENERATED"
  | "QA_RUNNING"
  | "QA_PASSED"
  | "QA_FAILED"
  | "DRAFT_CREATED"
  | "FAILED";

export type ResearchStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type QaStatus = "PENDING" | "IN_PROGRESS" | "PASSED" | "FAILED";
export type ImageStatus = "PENDING" | "GENERATING" | "READY" | "FAILED" | "SKIPPED";
export type ScheduleStatus =
  | "UNSCHEDULED"
  | "QUEUED"
  | "SCHEDULED"
  | "PROCESSING"
  | "PUBLISHED"
  | "CANCELLED"
  | "HOLD"
  | "FAILED";

export interface IBlogAutomationJob extends Document {
  _id: mongoose.Types.ObjectId;
  blogId?: mongoose.Types.ObjectId;
  externalJobId: string;
  topic: string;
  articleType: AutomationArticleType;
  generationStatus: GenerationStatus;
  researchStatus: ResearchStatus;
  qaStatus: QaStatus;
  imageStatus: ImageStatus;
  scheduleStatus: ScheduleStatus;
  scheduledAt?: Date;
  timezone: string;
  sourceCount: number;
  verifiedClaimCount: number;
  uncertainClaimCount: number;
  conflictingClaimCount: number;
  warningCount: number;
  qaScore: number;
  generatedBy: string;
  generationModel: string;
  dryRun: boolean;
  errorCode?: string;
  errorMessage?: string;
  isCurrentAffairs: boolean;
  eventDate?: Date;
  researchDate?: Date;
  lastVerifiedAt?: Date;
  requiresFreshVerification: boolean;
  adminApproved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlogAutomationJobSchema = new Schema<IBlogAutomationJob>(
  {
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      index: true,
    },
    externalJobId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    articleType: {
      type: String,
      enum: ["RAJASTHAN_GK", "CURRENT_AFFAIRS", "EXAM_UPDATES", "STATIC_GK", "STUDY_GUIDE"],
      default: "RAJASTHAN_GK",
      index: true,
    },
    generationStatus: {
      type: String,
      enum: [
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
      ],
      default: "DISCOVERED",
      index: true,
    },
    researchStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    qaStatus: {
      type: String,
      enum: ["PENDING", "IN_PROGRESS", "PASSED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    imageStatus: {
      type: String,
      enum: ["PENDING", "GENERATING", "READY", "FAILED", "SKIPPED"],
      default: "PENDING",
    },
    scheduleStatus: {
      type: String,
      enum: [
        "UNSCHEDULED",
        "QUEUED",
        "SCHEDULED",
        "PROCESSING",
        "PUBLISHED",
        "CANCELLED",
        "HOLD",
        "FAILED",
      ],
      default: "UNSCHEDULED",
      index: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    sourceCount: {
      type: Number,
      default: 0,
    },
    verifiedClaimCount: {
      type: Number,
      default: 0,
    },
    uncertainClaimCount: {
      type: Number,
      default: 0,
    },
    conflictingClaimCount: {
      type: Number,
      default: 0,
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    qaScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    generatedBy: {
      type: String,
      default: "rajasthan_exam_blogs",
    },
    generationModel: {
      type: String,
      default: "antigravity-research-v1",
    },
    dryRun: {
      type: Boolean,
      default: false,
    },
    errorCode: {
      type: String,
      trim: true,
    },
    errorMessage: {
      type: String,
      trim: true,
    },
    isCurrentAffairs: {
      type: Boolean,
      default: false,
    },
    eventDate: Date,
    researchDate: Date,
    lastVerifiedAt: Date,
    requiresFreshVerification: {
      type: Boolean,
      default: false,
    },
    adminApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvedBy: String,
    approvedAt: Date,
    publishedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast scheduler queries and queue views
BlogAutomationJobSchema.index({ scheduleStatus: 1, scheduledAt: 1, adminApproved: 1 });
BlogAutomationJobSchema.index({ generationStatus: 1, createdAt: -1 });

export const BlogAutomationJob: Model<IBlogAutomationJob> =
  mongoose.models.BlogAutomationJob ||
  mongoose.model<IBlogAutomationJob>("BlogAutomationJob", BlogAutomationJobSchema);

export default BlogAutomationJob;
