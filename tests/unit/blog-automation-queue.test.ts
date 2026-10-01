import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { BlogAutomationRepository } from "@/server/repositories/blog-automation";
import { BlogRepository } from "@/server/repositories/blog";
import { BlogService } from "@/server/services/blog-service";

describe("Blog Automation Queue & Approval Workflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should update queue item to approved when action is APPROVE", async () => {
    const mockId = new mongoose.Types.ObjectId().toString();

    vi.spyOn(BlogAutomationRepository, "findJobById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockId),
      topic: "राजस्थान की नदियां",
      adminApproved: false,
    } as any);

    vi.spyOn(BlogAutomationRepository, "updateJob").mockImplementation(async (id, updates) => {
      return {
        _id: new mongoose.Types.ObjectId(id),
        topic: "राजस्थान की नदियां",
        ...updates,
      } as any;
    });

    const result = await BlogAutomationService.updateQueueItem(
      mockId,
      { action: "APPROVE" },
      "AdminTester"
    );

    expect(result.success).toBe(true);
    expect(result.job?.adminApproved).toBe(true);
    expect(result.job?.approvedBy).toBe("AdminTester");
    expect(result.job?.approvedAt).toBeDefined();
  });

  it("should calculate correct staggered publish intervals in batch scheduling", async () => {
    const id1 = new mongoose.Types.ObjectId().toString();
    const id2 = new mongoose.Types.ObjectId().toString();

    vi.spyOn(BlogAutomationRepository, "findJobById").mockImplementation(async (id: string) => {
      return {
        _id: new mongoose.Types.ObjectId(id),
        topic: `Topic ${id}`,
        qaStatus: "PASSED",
        adminApproved: true,
      } as any;
    });

    vi.spyOn(BlogAutomationRepository, "updateJob").mockResolvedValue({} as any);

    const result = await BlogAutomationService.batchSchedule(
      {
        jobIds: [id1, id2],
        startDate: "2026-10-02",
        startTime: "08:00",
        intervalHours: 6,
        timezone: "Asia/Kolkata",
      },
      "Admin"
    );

    expect(result.success).toBe(true);
    expect(result.result?.scheduledCount).toBe(2);
    expect(result.result?.intervalHours).toBe(6);

    const firstTime = new Date(result.result?.firstPublishTime!).getTime();
    const secondTime = new Date(result.result?.lastPublishTime!).getTime();
    const diffHours = (secondTime - firstTime) / (1000 * 60 * 60);

    expect(diffHours).toBe(6);
  });

  it("should block manual publication if pre-publish validation fails (e.g. not admin approved)", async () => {
    const mockJobId = new mongoose.Types.ObjectId().toString();
    const mockBlogId = new mongoose.Types.ObjectId().toString();

    vi.spyOn(BlogAutomationRepository, "findJobById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockJobId),
      blogId: new mongoose.Types.ObjectId(mockBlogId),
      topic: "राजस्थान का इतिहास",
      qaStatus: "PASSED",
      adminApproved: false, // Not approved!
    } as any);

    vi.spyOn(BlogRepository, "findById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockBlogId),
      title: "राजस्थान का इतिहास",
      content: "<p>मान्य सामग्री</p>",
      status: "DRAFT",
    } as any);

    const result = await BlogAutomationService.publishManually(mockJobId, "Admin");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Human admin approval required");
  });

  it("should successfully publish an approved draft with valid content", async () => {
    const mockJobId = new mongoose.Types.ObjectId().toString();
    const mockBlogId = new mongoose.Types.ObjectId().toString();

    vi.spyOn(BlogAutomationRepository, "findJobById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockJobId),
      blogId: new mongoose.Types.ObjectId(mockBlogId),
      topic: "राजस्थान का इतिहास",
      qaStatus: "PASSED",
      adminApproved: true,
      conflictingClaimCount: 0,
      isCurrentAffairs: false,
    } as any);

    vi.spyOn(BlogRepository, "findById").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(mockBlogId),
      title: "राजस्थान का इतिहास",
      content: "<h2>1. सीधा उत्तर</h2><p>विस्तृत परीक्षा नोट्स और अध्ययन सामग्री।</p>",
      status: "DRAFT",
    } as any);

    vi.spyOn(BlogService, "publishBlog").mockResolvedValue({
      success: true,
      blog: { _id: new mongoose.Types.ObjectId(mockBlogId), status: "PUBLISHED" } as any,
    });

    vi.spyOn(BlogAutomationRepository, "updateJob").mockResolvedValue({} as any);

    const result = await BlogAutomationService.publishManually(mockJobId, "Admin");

    expect(result.success).toBe(true);
    expect(result.blogId).toBe(mockBlogId);
  });
});
