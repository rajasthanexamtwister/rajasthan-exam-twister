import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

import sitemap from "@/app/sitemap";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import { Quiz } from "@/server/models/Quiz";
import { TestSeries } from "@/server/models/TestSeries";
import { getSiteUrl } from "@/server/lib/seo";

describe("Sitemap & Domain Isolation (https://www.rajasthanexamtwister.in)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should resolve production canonical site URL to https://www.rajasthanexamtwister.in", () => {
    const siteUrl = getSiteUrl();
    expect(siteUrl).toBe("https://www.rajasthanexamtwister.in");
  });

  it("should strictly include only PUBLISHED blogs in sitemap and exclude DRAFT automation items", async () => {
    // Mock published blogs
    const findBlogSpy = vi.spyOn(Blog, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          slug: "published-rajasthan-gk",
          updatedAt: new Date("2026-10-01"),
          publishedAt: new Date("2026-10-01"),
        },
      ]),
    } as any);

    vi.spyOn(Note, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    vi.spyOn(Quiz, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    vi.spyOn(TestSeries, "find").mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const sitemapEntries = await sitemap();

    // Verify query only targets status: "PUBLISHED"
    expect(findBlogSpy).toHaveBeenCalledWith(
      { status: "PUBLISHED" },
      "slug updatedAt publishedAt"
    );

    const blogUrls = sitemapEntries.map((e) => e.url);

    // Verify published URL is present with https://www.rajasthanexamtwister.in
    expect(blogUrls).toContain("https://www.rajasthanexamtwister.in/blogs/published-rajasthan-gk");

    // Verify draft / unapproved / scheduled items are never in sitemap
    expect(blogUrls.some((u) => u.includes("draft"))).toBe(false);
  });
});
