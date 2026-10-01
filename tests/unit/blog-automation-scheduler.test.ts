import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

import { BlogAutomationScheduler } from "@/server/services/blog-automation/scheduler";
import { BlogAutomationRepository } from "@/server/repositories/blog-automation";
import { BlogRepository } from "@/server/repositories/blog";
import { BlogService } from "@/server/services/blog-service";

describe("Blog Automation Scheduler & Pre-Publish Safeguards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should place stale Current Affairs on HOLD when last verified > 24 hours ago", async () => {
    const mockJobId = new mongoose.Types.ObjectId().toString();
    const mockBlogId = new mongoose.Types.ObjectId().toString();

    const staleDate = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago

    const mockJob = {
      _id: new mongoose.Types.ObjectId(mockJobId),
      blogId: new mongoose.Types.ObjectId(mockBlogId),
      topic: "राजस्थान समसामयिकी अक्टूबर 2026",
      qaStatus: "PASSED",
      adminApproved: true,
      conflictingClaimCount: 0,
      isCurrentAffairs: true,
      requiresFreshVerification: true,
      lastVerifiedAt: staleDate,
    };

    vi.spyOn(BlogAutomationRepository, "findDueJobs").mockResolvedValue([mockJob as any]);
    vi.spyOn(BlogAutomationRepository, "lockJobForProcessing").mockResolvedValue(mockJob as any);
    vi.spyOn(BlogRepository, "findById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockBlogId),
      title: "राजस्थान समसामयिकी",
      content: "<p>सामग्री</p>",
      status: "DRAFT",
    } as any);

    const updateSpy = vi.spyOn(BlogAutomationRepository, "updateJob").mockResolvedValue({} as any);

    const report = await BlogAutomationScheduler.runPublisherCron();

    expect(report.scannedCount).toBe(1);
    expect(report.heldCount).toBe(1);
    expect(report.publishedCount).toBe(0);

    expect(updateSpy).toHaveBeenCalledWith(
      mockJobId,
      expect.objectContaining({
        scheduleStatus: "HOLD",
        errorCode: "STALE_CURRENT_AFFAIRS",
      })
    );
  });

  it("should successfully publish approved, non-stale due jobs atomically", async () => {
    const mockJobId = new mongoose.Types.ObjectId().toString();
    const mockBlogId = new mongoose.Types.ObjectId().toString();

    const freshDate = new Date();

    const mockJob = {
      _id: new mongoose.Types.ObjectId(mockJobId),
      blogId: new mongoose.Types.ObjectId(mockBlogId),
      topic: "राजस्थान की प्रमुख झीलें",
      qaStatus: "PASSED",
      adminApproved: true,
      conflictingClaimCount: 0,
      isCurrentAffairs: false,
      requiresFreshVerification: false,
      lastVerifiedAt: freshDate,
    };

    vi.spyOn(BlogAutomationRepository, "findDueJobs").mockResolvedValue([mockJob as any]);
    vi.spyOn(BlogAutomationRepository, "lockJobForProcessing").mockResolvedValue(mockJob as any);
    vi.spyOn(BlogRepository, "findById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockBlogId),
      title: "राजस्थान की प्रमुख झीलें",
      content: "<h2>1. सीधा उत्तर</h2><p>जयसमंद राजस्थान की सबसे बड़ी मीठे पानी की कृत्रिम झील है।</p>",
      status: "DRAFT",
    } as any);

    vi.spyOn(BlogService, "publishBlog").mockResolvedValue({
      success: true,
      blog: { _id: new mongoose.Types.ObjectId(mockBlogId), status: "PUBLISHED" } as any,
    });

    const updateSpy = vi.spyOn(BlogAutomationRepository, "updateJob").mockResolvedValue({} as any);

    const report = await BlogAutomationScheduler.runPublisherCron();

    expect(report.scannedCount).toBe(1);
    expect(report.publishedCount).toBe(1);
    expect(report.heldCount).toBe(0);

    expect(updateSpy).toHaveBeenCalledWith(
      mockJobId,
      expect.objectContaining({
        scheduleStatus: "PUBLISHED",
      })
    );
  });
});
