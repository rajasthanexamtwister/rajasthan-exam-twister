import { BlogAutomationRepository } from "@/server/repositories/blog-automation";
import { BlogAutomationService } from "./service";
import { BlogService } from "@/server/services/blog-service";
import { connectToDatabase } from "@/server/lib/mongodb";

export interface CronExecutionResult {
  success: boolean;
  executedAt: Date;
  scannedCount: number;
  publishedCount: number;
  heldCount: number;
  failedCount: number;
  details: Array<{
    jobId: string;
    topic: string;
    status: "PUBLISHED" | "HELD" | "FAILED";
    reasons?: string[];
  }>;
}

export class BlogAutomationScheduler {
  /**
   * Main publisher cron task
   */
  static async runPublisherCron(): Promise<CronExecutionResult> {
    await connectToDatabase();

    const dueJobs = await BlogAutomationRepository.findDueJobs(20);
    const details: CronExecutionResult["details"] = [];

    let publishedCount = 0;
    let heldCount = 0;
    let failedCount = 0;

    for (const job of dueJobs) {
      const jobIdStr = job._id.toString();

      // 1. Acquire atomic lock (Idempotency check)
      const lockedJob = await BlogAutomationRepository.lockJobForProcessing(jobIdStr);
      if (!lockedJob) {
        // Job was already acquired or processed by another simultaneous worker
        continue;
      }

      // 2. Run 15-Point Pre-Publish Validation
      const validation = await BlogAutomationService.validatePrePublish(lockedJob);

      if (!validation.eligible) {
        if (validation.requiresHold) {
          await BlogAutomationRepository.updateJob(jobIdStr, {
            scheduleStatus: "HOLD",
            errorCode: validation.errorCode || "STALE_CURRENT_AFFAIRS",
            errorMessage: validation.reasons.join("; "),
          });
          heldCount++;
          details.push({
            jobId: jobIdStr,
            topic: lockedJob.topic,
            status: "HELD",
            reasons: validation.reasons,
          });
        } else {
          await BlogAutomationRepository.updateJob(jobIdStr, {
            scheduleStatus: "HOLD",
            errorCode: "VALIDATION_FAILED",
            errorMessage: validation.reasons.join("; "),
          });
          heldCount++;
          details.push({
            jobId: jobIdStr,
            topic: lockedJob.topic,
            status: "HELD",
            reasons: validation.reasons,
          });
        }
        continue;
      }

      // 3. Publish the blog using BlogService
      const blogIdStr = lockedJob.blogId!.toString();
      const publishResult = await BlogService.publishBlog(blogIdStr);

      if (publishResult.success) {
        await BlogAutomationRepository.updateJob(jobIdStr, {
          scheduleStatus: "PUBLISHED",
          publishedAt: new Date(),
        });
        publishedCount++;
        details.push({
          jobId: jobIdStr,
          topic: lockedJob.topic,
          status: "PUBLISHED",
        });
      } else {
        await BlogAutomationRepository.updateJob(jobIdStr, {
          scheduleStatus: "FAILED",
          errorCode: "PUBLISH_FAILED",
          errorMessage: publishResult.error || "Failed to publish blog document",
        });
        failedCount++;
        details.push({
          jobId: jobIdStr,
          topic: lockedJob.topic,
          status: "FAILED",
          reasons: [publishResult.error || "Blog publication failed"],
        });
      }
    }

    return {
      success: true,
      executedAt: new Date(),
      scannedCount: dueJobs.length,
      publishedCount,
      heldCount,
      failedCount,
      details,
    };
  }
}
