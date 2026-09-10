import { describe, it, expect } from "vitest";
import { slugify, generateUniqueSlug } from "@/server/lib/slugify";

describe("Slug Generator & Collision Handling", () => {
  it("should generate URL-safe lowercase slugs", () => {
    expect(slugify("REET 2026 Exam Pattern & Syllabus")).toBe("reet-2026-exam-pattern-and-syllabus");
    expect(slugify("Rajasthan History: Mughal Era")).toBe("rajasthan-history-mughal-era");
  });

  it("should auto-suffix on slug collision (-2, -3, ...)", async () => {
    const existingSlugs = new Set(["reet-exam-guide", "reet-exam-guide-2"]);

    const isSlugTaken = async (slug: string) => existingSlugs.has(slug);

    const uniqueSlug = await generateUniqueSlug("REET Exam Guide", isSlugTaken);
    expect(uniqueSlug).toBe("reet-exam-guide-3");
  });

  it("should preserve immutable slug if already published", async () => {
    const isSlugTaken = async () => true;
    const existingSlug = "original-published-slug";

    const slug = await generateUniqueSlug("Brand New Title", isSlugTaken, existingSlug);
    expect(slug).toBe("original-published-slug");
  });
});
