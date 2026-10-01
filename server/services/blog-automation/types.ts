import {
  AutomationArticleType,
  GenerationStatus,
  ScheduleStatus,
  QaStatus,
  ImageStatus,
} from "@/server/models/BlogAutomationJob";
import { AiArticlePayload } from "@/server/validation/blog-automation";

export interface AutomationConfig {
  enabled: boolean;
  dryRun: boolean;
  maxBatchSize: number;
  cronSecret: string;
  reviewRequired: boolean;
}

export type AutomationErrorCode =
  | "RESEARCH_FAILED"
  | "GENERATION_FAILED"
  | "VALIDATION_FAILED"
  | "QA_FAILED"
  | "IMAGE_FAILED"
  | "CMS_SAVE_FAILED"
  | "SCHEDULE_FAILED"
  | "PUBLISH_FAILED"
  | "SOURCE_CONFLICT"
  | "STALE_CURRENT_AFFAIRS"
  | "APPROVAL_REQUIRED"
  | "DUPLICATE_TOPIC"
  | "INTERNAL_ERROR";

export interface TopicCandidate {
  topic: string;
  articleType: AutomationArticleType;
  category: string;
  keywords: string[];
  relevanceScore: number;
  officialSourceAvailable: boolean;
  recommendation: "CREATE_NEW" | "UPDATE_EXISTING" | "CREATE_NEW_ANGLE" | "SKIP";
  existingBlogSlug?: string;
  reason?: string;
}

export interface GenerationResult {
  success: boolean;
  jobId?: string;
  externalJobId?: string;
  blogId?: string;
  slug?: string;
  title?: string;
  topic?: string;
  generationStatus?: GenerationStatus;
  qaStatus?: QaStatus;
  scheduleStatus?: ScheduleStatus;
  dryRun?: boolean;
  error?: string;
  errorCode?: AutomationErrorCode;
  qaScore?: number;
  previewUrl?: string;
}

export interface PrePublishValidationResult {
  eligible: boolean;
  reasons: string[];
  errorCode?: AutomationErrorCode;
  requiresHold?: boolean;
}

export interface BatchScheduleResult {
  scheduledCount: number;
  firstPublishTime?: Date;
  lastPublishTime?: Date;
  intervalHours: number;
  jobs: Array<{
    jobId: string;
    topic: string;
    scheduledAt: Date;
    adminApproved: boolean;
  }>;
}
