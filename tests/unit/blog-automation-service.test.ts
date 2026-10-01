import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { BlogAutomationService } from "@/server/services/blog-automation/service";
import { BlogRepository } from "@/server/repositories/blog";
import { BlogAutomationRepository } from "@/server/repositories/blog-automation";
import { BlogService } from "@/server/services/blog-service";
import { Category } from "@/server/models/Category";
import { Tag } from "@/server/models/Tag";
import { Media } from "@/server/models/Media";

describe("Blog Automation Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should discover candidate topics and tag existing published topics with UPDATE_EXISTING", async () => {
    vi.spyOn(BlogRepository, "findBySlug").mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
      title: "राजस्थान के प्रमुख लोक नृत्य",
      slug: "rajasthan-ke-pramukh-lok-nritya",
      status: "PUBLISHED",
    } as any);

    vi.spyOn(BlogAutomationRepository, "findJobByExternalId").mockResolvedValue(null);

    const candidates = await BlogAutomationService.discoverTopics({ count: 5 });
    expect(candidates.length).toBeGreaterThan(0);

    const danceTopic = candidates.find((c) => c.topic.includes("लोक नृत्य"));
    if (danceTopic) {
      expect(danceTopic.recommendation).toBe("UPDATE_EXISTING");
      expect(danceTopic.existingBlogSlug).toContain("lok-nritya");
    }
  });

  it("should create a draft Blog and BlogAutomationJob when processing a valid AI payload", async () => {
    const mockBlogId = new mongoose.Types.ObjectId();
    const mockJobId = new mongoose.Types.ObjectId();

    vi.spyOn(Category, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), name: "Rajasthan GK", slug: "rajasthan-gk" }),
    } as any);

    vi.spyOn(Tag, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), name: "Art & Culture", slug: "art-culture" }),
    } as any);

    vi.spyOn(Media, "findOne").mockReturnValue({
      exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(), url: "https://example.com/cover.jpg" }),
    } as any);

    vi.spyOn(BlogService, "createBlog").mockResolvedValue({
      _id: mockBlogId,
      title: "राजस्थान के प्रमुख लोक नृत्य",
      slug: "rajasthan-ke-pramukh-lok-nritya",
      status: "DRAFT",
    } as any);

    vi.spyOn(BlogAutomationRepository, "createJob").mockResolvedValue({
      _id: mockJobId,
      blogId: mockBlogId,
      topic: "राजस्थान के प्रमुख लोक नृत्य",
      generationStatus: "DRAFT_CREATED",
      qaStatus: "PASSED",
      scheduleStatus: "UNSCHEDULED",
      qaScore: 92,
    } as any);

    vi.spyOn(BlogAutomationRepository, "saveResearch").mockResolvedValue({} as any);

    const payload = {
      externalJobId: "agy_test_001",
      topic: "राजस्थान के प्रमुख लोक नृत्य",
      articleType: "RAJASTHAN_GK" as const,
      title: "राजस्थान के प्रमुख लोक नृत्य एवं उनकी विशेषताएं",
      contentHtml: "<h2>1. सीधा उत्तर</h2><p>घूमर राजस्थान का राज्य नृत्य है।</p>",
      category: "Rajasthan GK",
      tags: ["Art & Culture"],
      research: {
        sources: [{ url: "https://rajbhawan.rajasthan.gov.in", title: "Raj Portal", isOfficial: true }],
        verifiedClaims: ["घूमर राज्य नृत्य है"],
      },
      qa: { score: 92, status: "PASSED" as const },
    };

    const result = await BlogAutomationService.processIncomingAiArticle(payload, "Admin");

    expect(result.success).toBe(true);
    expect(result.generationStatus).toBe("DRAFT_CREATED");
    expect(result.scheduleStatus).toBe("UNSCHEDULED");
    expect(result.qaScore).toBe(92);
    expect(result.blogId).toBe(mockBlogId.toString());
  });

  it("should support dry-run mode without modifying live database", async () => {
    const payload = {
      externalJobId: "agy_dry_run_001",
      topic: "राजस्थान का एकीकरण",
      articleType: "RAJASTHAN_GK" as const,
      title: "राजस्थान का एकीकरण : 7 चरणों का विस्तृत विवरण",
      contentHtml: "<h2>1. सीधा उत्तर</h2><p>राजस्थान का एकीकरण 7 चरणों में पूरा हुआ।</p>",
      dryRun: true,
      research: { sources: [] },
      qa: { score: 90, status: "PASSED" as const },
    };

    const createBlogSpy = vi.spyOn(BlogService, "createBlog");
    const createJobSpy = vi.spyOn(BlogAutomationRepository, "createJob");

    const result = await BlogAutomationService.processIncomingAiArticle(payload, "Admin");

    expect(result.success).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(createBlogSpy).not.toHaveBeenCalled();
    expect(createJobSpy).not.toHaveBeenCalled();
  });
});
