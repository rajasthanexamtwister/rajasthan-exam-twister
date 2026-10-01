import mongoose from "mongoose";
import { BlogAutomationRepository } from "@/server/repositories/blog-automation";
import { BlogRepository } from "@/server/repositories/blog";
import { BlogService } from "@/server/services/blog-service";
import { BlogEngineClient } from "./client";
import { BlogAutomationValidator } from "./validator";
import { BlogAutomationMapper } from "./mapper";
import {
  GenerationResult,
  TopicCandidate,
  PrePublishValidationResult,
  BatchScheduleResult,
} from "./types";
import {
  AiArticlePayload,
  BatchGenerateInput,
  DiscoverTopicsInput,
  BatchScheduleInput,
  UpdateQueueItemInput,
  QueueFilterQuery,
} from "@/server/validation/blog-automation";
import { slugify } from "@/server/lib/slugify";
import { IBlogAutomationJob } from "@/server/models/BlogAutomationJob";

export class BlogAutomationService {
  /**
   * Topic discovery with duplicate and relevance checking
   */
  static async discoverTopics(options: DiscoverTopicsInput): Promise<TopicCandidate[]> {
    const rawCandidates = await BlogEngineClient.discoverTopics(options);

    const enrichedCandidates: TopicCandidate[] = [];

    for (const candidate of rawCandidates) {
      const slugCandidate = slugify(candidate.topic);

      // Check existing published/draft blogs
      const existingBlog = await BlogRepository.findBySlug(slugCandidate);
      // Check existing automation jobs
      const existingJob = await BlogAutomationRepository.findJobByExternalId(slugCandidate);

      let recommendation: TopicCandidate["recommendation"] = "CREATE_NEW";
      let reason: string | undefined;

      if (existingBlog) {
        if (existingBlog.status === "PUBLISHED") {
          recommendation = "UPDATE_EXISTING";
          reason = `Topic already adequately covered in published blog: /blogs/${existingBlog.slug}`;
        } else {
          recommendation = "SKIP";
          reason = "A draft blog already exists for this topic.";
        }
      } else if (existingJob) {
        recommendation = "SKIP";
        reason = "An automation job for this topic is already in queue.";
      }

      enrichedCandidates.push({
        ...candidate,
        recommendation: (existingBlog || existingJob) ? recommendation : (candidate.recommendation || recommendation),
        existingBlogSlug: existingBlog?.slug,
        reason: (existingBlog || existingJob) ? reason : (candidate.reason || reason),
      });
    }

    return enrichedCandidates;
  }

  /**
   * Process and persist a validated AI article generation payload
   */
  static async processIncomingAiArticle(
    rawPayload: unknown,
    requestedBy: string = "Admin"
  ): Promise<GenerationResult> {
    // 1. Validation and Sanitization
    const validation = BlogAutomationValidator.validatePayload(rawPayload);
    if (!validation.valid || !validation.data) {
      return {
        success: false,
        errorCode: validation.errorCode || "VALIDATION_FAILED",
        error: validation.errorMessage || "Payload validation failed",
      };
    }

    const payload = validation.data;
    const isDryRun = payload.dryRun || BlogEngineClient.isDryRun();

    // 2. Handle Dry-Run Simulation
    if (isDryRun) {
      const simulatedSlug = slugify(payload.title);
      return {
        success: true,
        dryRun: true,
        title: payload.title,
        topic: payload.topic,
        slug: simulatedSlug,
        qaScore: payload.qa.score,
        qaStatus: payload.qa.status,
        generationStatus: "GENERATED",
        scheduleStatus: "UNSCHEDULED",
        previewUrl: `/admin/blog-automation/preview?dryRun=true&topic=${encodeURIComponent(payload.topic)}`,
      };
    }

    // 3. Resolve Taxonomy and Media
    const categoryId = await BlogAutomationMapper.resolveCategoryId(payload.category);
    const tagIds = await BlogAutomationMapper.resolveTagIds(payload.tags);
    const coverImageId = await BlogAutomationMapper.resolveCoverImageId(payload.image);

    // 4. Map to Blog Draft Input
    const blogDraftInput = BlogAutomationMapper.mapToCreateBlogInput(
      payload,
      categoryId,
      tagIds,
      coverImageId
    );

    // 5. Persist Blog Draft (status is always DRAFT)
    let createdBlog;
    try {
      createdBlog = await BlogService.createBlog(blogDraftInput);
    } catch (err: any) {
      console.error("Failed to create blog draft in CMS:", err);
      return {
        success: false,
        errorCode: "CMS_SAVE_FAILED",
        error: `Failed to create blog draft: ${err.message || String(err)}`,
      };
    }

    // 6. Persist Automation Metadata Job
    const conflictingCount = payload.research.conflictingClaims?.length || 0;
    const uncertainCount = payload.research.uncertainClaims?.length || 0;
    const verifiedCount = payload.research.verifiedClaims?.length || 0;

    let automationJob: IBlogAutomationJob;
    try {
      automationJob = await BlogAutomationRepository.createJob({
        blogId: createdBlog._id,
        externalJobId: payload.externalJobId,
        topic: payload.topic,
        articleType: payload.articleType,
        generationStatus: "DRAFT_CREATED",
        researchStatus: "COMPLETED",
        qaStatus: payload.qa.status,
        imageStatus: payload.image?.status || "READY",
        scheduleStatus: "UNSCHEDULED",
        sourceCount: payload.research.sources?.length || 0,
        verifiedClaimCount: verifiedCount,
        uncertainClaimCount: uncertainCount,
        conflictingClaimCount: conflictingCount,
        warningCount: (payload.qa.warnings?.length || 0) + validation.warnings.length,
        qaScore: payload.qa.score,
        generatedBy: payload.research.generatedBy || "antigravity_editorial",
        generationModel: payload.research.model || "antigravity-research-v1",
        dryRun: false,
        isCurrentAffairs: payload.isCurrentAffairs || false,
        eventDate: payload.research.eventDate ? new Date(payload.research.eventDate) : undefined,
        researchDate: payload.research.researchDate ? new Date(payload.research.researchDate) : new Date(),
        lastVerifiedAt: payload.research.lastVerifiedAt ? new Date(payload.research.lastVerifiedAt) : new Date(),
        requiresFreshVerification: payload.isCurrentAffairs,
        adminApproved: false, // Invariant: human review required
      });
    } catch (err: any) {
      console.error("Failed to persist BlogAutomationJob record:", err);
      return {
        success: false,
        errorCode: "CMS_SAVE_FAILED",
        error: `Failed to create automation job: ${err.message || String(err)}`,
      };
    }

    // 7. Persist Research Audit Record
    try {
      await BlogAutomationRepository.saveResearch({
        automationJobId: automationJob._id,
        blogId: createdBlog._id,
        externalJobId: payload.externalJobId,
        topic: payload.topic,
        researchDate: payload.research.researchDate ? new Date(payload.research.researchDate) : new Date(),
        sources: payload.research.sources?.map((s) => ({
          ...s,
          publishDate: s.publishDate ? new Date(s.publishDate) : undefined,
        })) || [],
        verifiedClaims: payload.research.verifiedClaims || [],
        uncertainClaims: payload.research.uncertainClaims || [],
        conflictingClaims: payload.research.conflictingClaims || [],
        seoBrief: payload.research.seoBrief,
        internalLinks: payload.research.internalLinks || [],
        faqs: payload.research.faqs || [],
        mcqs: payload.research.mcqs || [],
        generationModel: payload.research.model || "antigravity-research-v1",
        generatedBy: payload.research.generatedBy || "antigravity_editorial",
      });
    } catch (err) {
      console.warn("Non-fatal: failed to persist BlogResearch audit entry:", err);
    }

    return {
      success: true,
      jobId: automationJob._id.toString(),
      externalJobId: payload.externalJobId,
      blogId: createdBlog._id.toString(),
      slug: createdBlog.slug,
      title: createdBlog.title,
      topic: payload.topic,
      generationStatus: "DRAFT_CREATED",
      qaStatus: payload.qa.status,
      scheduleStatus: "UNSCHEDULED",
      qaScore: payload.qa.score,
      previewUrl: `/admin/blogs/${createdBlog._id}`,
    };
  }

  /**
   * Batch generation workflow
   */
  static async generateBatch(input: BatchGenerateInput): Promise<{
    success: boolean;
    totalRequested: number;
    generatedCount: number;
    failedCount: number;
    results: GenerationResult[];
  }> {
    const configMax = parseInt(process.env.BLOG_AUTOMATION_MAX_BATCH_SIZE || "20", 10);
    const count = Math.min(input.count || 5, configMax);

    // 1. Build topics list
    let topicsToGenerate: Array<{ topic: string; articleType: string }> = [];

    if (input.topics && input.topics.length > 0) {
      topicsToGenerate = input.topics.slice(0, count).map((t) => ({
        topic: t,
        articleType: "RAJASTHAN_GK",
      }));
    } else {
      // Use mix distribution
      const mix = input.articleMix || {
        rajasthanGk: 2,
        currentAffairs: 1,
        examUpdates: 1,
        staticGk: 1,
        studyGuide: 0,
      };

      const candidates = await this.discoverTopics({ count });
      topicsToGenerate = candidates.slice(0, count).map((c) => ({
        topic: c.topic,
        articleType: c.articleType,
      }));
    }

    const results: GenerationResult[] = [];
    let generatedCount = 0;
    let failedCount = 0;

    for (const item of topicsToGenerate) {
      try {
        const payload = await BlogEngineClient.generateArticle({
          topic: item.topic,
          articleType: item.articleType,
          dryRun: input.dryRun,
          requestedBy: input.requestedBy,
        });

        const result = await this.processIncomingAiArticle(payload, input.requestedBy);
        results.push(result);

        if (result.success) {
          generatedCount++;
        } else {
          failedCount++;
        }
      } catch (err: any) {
        failedCount++;
        results.push({
          success: false,
          topic: item.topic,
          errorCode: "GENERATION_FAILED",
          error: err.message || "Unknown error during batch item generation",
        });
      }
    }

    return {
      success: generatedCount > 0,
      totalRequested: topicsToGenerate.length,
      generatedCount,
      failedCount,
      results,
    };
  }

  /**
   * List content queue items
   */
  static async listQueue(options: QueueFilterQuery) {
    return BlogAutomationRepository.listJobs(options);
  }

  /**
   * Get single queue item with associated Blog and Research
   */
  static async getQueueItem(id: string) {
    const job = await BlogAutomationRepository.findJobById(id);
    if (!job) return null;

    const research = await BlogAutomationRepository.findResearchByJobId(id);
    return {
      job,
      research,
    };
  }

  /**
   * Update queue item (Approve, Hold, Cancel, Reschedule, Retry)
   */
  static async updateQueueItem(
    id: string,
    input: UpdateQueueItemInput,
    adminUser: string = "Admin"
  ): Promise<{ success: boolean; job?: IBlogAutomationJob; error?: string }> {
    const job = await BlogAutomationRepository.findJobById(id);
    if (!job) {
      return { success: false, error: "Queue job not found" };
    }

    const updates: Partial<IBlogAutomationJob> = {};

    if (input.action === "APPROVE") {
      updates.adminApproved = true;
      updates.approvedBy = adminUser;
      updates.approvedAt = new Date();
    } else if (input.action === "HOLD") {
      updates.scheduleStatus = "HOLD";
    } else if (input.action === "CANCEL") {
      updates.scheduleStatus = "CANCELLED";
    } else if (input.action === "SCHEDULE") {
      if (input.scheduledAt) {
        updates.scheduledAt = new Date(input.scheduledAt);
        updates.scheduleStatus = "SCHEDULED";
      }
      if (input.timezone) {
        updates.timezone = input.timezone;
      }
    } else if (input.action === "VERIFY_FRESH") {
      updates.lastVerifiedAt = new Date();
      updates.requiresFreshVerification = false;
      if (job.scheduleStatus === "HOLD") {
        updates.scheduleStatus = "SCHEDULED";
      }
    } else if (input.action === "RETRY") {
      if (job.generationStatus === "FAILED" || job.scheduleStatus === "FAILED") {
        updates.generationStatus = "DRAFT_CREATED";
        updates.scheduleStatus = "UNSCHEDULED";
        updates.errorCode = undefined;
        updates.errorMessage = undefined;
      }
    }

    if (input.adminApproved !== undefined) {
      updates.adminApproved = input.adminApproved;
      if (input.adminApproved) {
        updates.approvedBy = adminUser;
        updates.approvedAt = new Date();
      }
    }

    if (input.scheduledAt !== undefined) {
      updates.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : undefined;
      if (input.scheduledAt && job.scheduleStatus === "UNSCHEDULED") {
        updates.scheduleStatus = "SCHEDULED";
      }
    }

    const updated = await BlogAutomationRepository.updateJob(id, updates);
    return { success: true, job: updated || undefined };
  }

  /**
   * Batch Schedule multiple items across interval
   */
  static async batchSchedule(
    input: BatchScheduleInput,
    adminUser: string = "Admin"
  ): Promise<{ success: boolean; result?: BatchScheduleResult; error?: string }> {
    const { jobIds, startDate, startTime, intervalHours, timezone } = input;

    if (!jobIds || jobIds.length === 0) {
      return { success: false, error: "No job IDs provided for batch scheduling" };
    }

    const baseDate = new Date(`${startDate}T${startTime}:00`);
    if (isNaN(baseDate.getTime())) {
      return { success: false, error: "Invalid start date/time format" };
    }

    const scheduledJobs: BatchScheduleResult["jobs"] = [];
    let currentScheduledTime = new Date(baseDate.getTime());

    for (const id of jobIds) {
      const job = await BlogAutomationRepository.findJobById(id);
      if (!job) continue;

      // Ensure QA passed
      if (job.qaStatus !== "PASSED") {
        continue;
      }

      await BlogAutomationRepository.updateJob(id, {
        scheduleStatus: "SCHEDULED",
        scheduledAt: new Date(currentScheduledTime.getTime()),
        timezone,
      });

      scheduledJobs.push({
        jobId: id,
        topic: job.topic,
        scheduledAt: new Date(currentScheduledTime.getTime()),
        adminApproved: job.adminApproved,
      });

      // Increment by interval
      currentScheduledTime = new Date(
        currentScheduledTime.getTime() + intervalHours * 60 * 60 * 1000
      );
    }

    return {
      success: true,
      result: {
        scheduledCount: scheduledJobs.length,
        firstPublishTime: scheduledJobs[0]?.scheduledAt,
        lastPublishTime: scheduledJobs[scheduledJobs.length - 1]?.scheduledAt,
        intervalHours,
        jobs: scheduledJobs,
      },
    };
  }

  /**
   * Manual publish of an approved queue item
   */
  static async publishManually(
    jobId: string,
    adminUser: string = "Admin"
  ): Promise<{ success: boolean; blogId?: string; error?: string }> {
    const job = await BlogAutomationRepository.findJobById(jobId);
    if (!job) {
      return { success: false, error: "Queue job not found" };
    }

    if (!job.blogId) {
      return { success: false, error: "Job does not have an associated Blog document" };
    }

    const blogIdStr = job.blogId.toString();

    // Pre-publish validation
    const validation = await this.validatePrePublish(job);
    if (!validation.eligible) {
      return {
        success: false,
        error: `Pre-publish validation failed: ${validation.reasons.join(", ")}`,
      };
    }

    // Execute Publish via BlogService
    const publishRes = await BlogService.publishBlog(blogIdStr);
    if (!publishRes.success) {
      await BlogAutomationRepository.updateJob(jobId, {
        scheduleStatus: "FAILED",
        errorCode: "PUBLISH_FAILED",
        errorMessage: publishRes.error,
      });
      return { success: false, error: publishRes.error };
    }

    // Update job status to PUBLISHED
    await BlogAutomationRepository.updateJob(jobId, {
      scheduleStatus: "PUBLISHED",
      publishedAt: new Date(),
      adminApproved: true,
      approvedBy: adminUser,
      approvedAt: new Date(),
    });

    return { success: true, blogId: blogIdStr };
  }

  /**
   * 15-Point Pre-Publish Validation
   */
  static async validatePrePublish(job: IBlogAutomationJob): Promise<PrePublishValidationResult> {
    const reasons: string[] = [];

    // 1. Blog exists
    if (!job.blogId) {
      return { eligible: false, reasons: ["Blog document does not exist"] };
    }

    const blog = await BlogRepository.findById(job.blogId.toString());
    if (!blog) {
      return { eligible: false, reasons: ["Blog document not found in database"] };
    }

    // 2. Blog is in DRAFT status
    if (blog.status !== "DRAFT") {
      reasons.push(`Blog is not in DRAFT status (Current status: ${blog.status})`);
    }

    // 3. QA Passed
    if (job.qaStatus !== "PASSED") {
      reasons.push(`Editorial QA status is not PASSED (Current: ${job.qaStatus})`);
    }

    // 4. Required Content Non-empty
    if (!blog.title || !blog.content || blog.content.replace(/<[^>]*>/g, "").trim().length < 30) {
      reasons.push("Blog content is empty or incomplete");
    }

    // 5. Unresolved Critical Conflicts
    if (job.conflictingClaimCount > 0) {
      reasons.push(`Job contains ${job.conflictingClaimCount} unresolved conflicting claims`);
    }

    // 6. Current Affairs Fresh Check
    if (job.isCurrentAffairs && job.requiresFreshVerification) {
      const now = Date.now();
      const lastVerified = job.lastVerifiedAt ? job.lastVerifiedAt.getTime() : 0;
      const hoursSinceVerification = (now - lastVerified) / (1000 * 60 * 60);

      if (hoursSinceVerification > 24) {
        return {
          eligible: false,
          requiresHold: true,
          errorCode: "STALE_CURRENT_AFFAIRS",
          reasons: ["Fresh verification required before publication for Current Affairs content (>24h old)"],
        };
      }
    }

    // 7. Human Approval Check
    if (!job.adminApproved) {
      reasons.push("Human admin approval required prior to publication");
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Get Dashboard Stats
   */
  static async getDashboardStats() {
    return BlogAutomationRepository.getDashboardStats();
  }
}
