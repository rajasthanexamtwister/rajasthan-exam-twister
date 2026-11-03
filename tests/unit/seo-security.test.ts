import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMetaDescription, stripHtml, getSiteUrl } from "@/server/lib/seo";
import { checkRateLimit, resetRateLimit } from "@/server/lib/rate-limit";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { Blog } from "@/server/models/Blog";
import { Note } from "@/server/models/Note";
import mongoose from "mongoose";

// Mock mongodb connection
vi.mock("@/server/lib/mongodb", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(true),
}));

// Mock Blog and Note models for sitemap
vi.mock("@/server/models/Blog", () => ({
  Blog: {
    find: vi.fn(),
  },
}));

vi.mock("@/server/models/Note", () => ({
  Note: {
    find: vi.fn(),
  },
}));

vi.mock("@/server/models/Quiz", () => ({
  Quiz: {
    find: vi.fn(),
  },
}));

vi.mock("@/server/models/TestSeries", () => ({
  TestSeries: {
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    }),
  },
}));

vi.mock("@/server/repositories/question-seo", () => ({
  QuestionSeoRepository: {
    listPublishedQuestionSlugs: vi.fn().mockResolvedValue([]),
  },
}));

describe("SEO Utilities & Metadata Generation", () => {
  it("should strip HTML and truncate at word boundary for fallback meta description", () => {
    const rawHtml = "<h2>Key Points</h2><p>Rajasthan has diverse physical divisions including the Aravalli Range, Thar Desert, Eastern Plains, and Hadoti Plateau. This guide covers all essentials for REET and RPSC.</p>";
    const description = generateMetaDescription(rawHtml, null, null, 120);

    expect(description).not.toContain("<h2>");
    expect(description).not.toContain("<p>");
    expect(description.endsWith("...")).toBe(true);
    expect(description.length).toBeLessThanOrEqual(125);
  });

  it("should prioritize custom metaDescription or excerpt over content", () => {
    const custom = "Custom curated meta description for high CTR.";
    const result = generateMetaDescription("<p>Ignored long text</p>", custom);
    expect(result).toBe(custom);

    const excerpt = "Curated excerpt";
    const result2 = generateMetaDescription("<p>Ignored long text</p>", null, excerpt);
    expect(result2).toBe(excerpt);
  });

  it("should strip nested HTML entities correctly", () => {
    const text = "<p>Rajasthan &amp; Mewar &lt;History&gt; &quot;Guide&quot;</p>";
    expect(stripHtml(text)).toBe('Rajasthan & Mewar <History> "Guide"');
  });

  it("should safely resolve getSiteUrl and fallback to production domain if env contains literal NEXT_PUBLIC_SITE_URL placeholder", () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://NEXT_PUBLIC_SITE_URL";
    expect(getSiteUrl()).toBe("https://www.rajasthanexamtwister.in");

    process.env.NEXT_PUBLIC_SITE_URL = "NEXT_PUBLIC_SITE_URL";
    expect(getSiteUrl()).toBe("https://www.rajasthanexamtwister.in");

    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });
});

describe("Robots & Sitemap Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate robots.txt allowing public routes and disallowing /admin/ and /api/", () => {
    const config = robots();
    expect(config.rules).toBeDefined();
    const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toContain("/admin/");
    expect(rule.disallow).toContain("/api/");
    expect(config.sitemap).toContain("sitemap.xml");
  });

  it("should dynamically generate sitemap including only PUBLISHED content and static routes", async () => {
    (Blog.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          slug: "rajasthan-gk-master-guide",
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
          publishedAt: new Date("2026-03-01T00:00:00.000Z"),
        },
      ]),
    });

    (Note.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          slug: "rajasthan-forts-revision",
          updatedAt: new Date("2026-03-02T00:00:00.000Z"),
          publishedAt: new Date("2026-03-02T00:00:00.000Z"),
        },
      ]),
    });

    const { Quiz } = await import("@/server/models/Quiz");
    (Quiz.find as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          slug: "rajasthan-history-mock-1",
          updatedAt: new Date("2026-03-03T00:00:00.000Z"),
          publishedAt: new Date("2026-03-03T00:00:00.000Z"),
        },
      ]),
    });

    const entries = await sitemap();

    // Verify Mongo query strictly searched { status: "PUBLISHED" } and excludes boosters
    expect(Blog.find).toHaveBeenCalledWith({ status: "PUBLISHED" }, expect.any(String));
    expect(Note.find).toHaveBeenCalledWith({ status: "PUBLISHED" }, expect.any(String));
    expect(Quiz.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "PUBLISHED",
        isPersonalizedBooster: { $ne: true },
      }),
      expect.any(String)
    );

    const urls = entries.map((e) => e.url);

    // Static pages
    expect(urls.some((u) => u.endsWith("/blogs"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/notes"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/categories"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/quizzes"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/search"))).toBe(true);
    expect(urls.some((u) => u.endsWith("/about"))).toBe(true);

    // Published content
    expect(urls.some((u) => u.includes("/blogs/rajasthan-gk-master-guide"))).toBe(true);
    expect(urls.some((u) => u.includes("/notes/rajasthan-forts-revision"))).toBe(true);
    expect(urls.some((u) => u.includes("/quizzes/rajasthan-history-mock-1"))).toBe(true);

    // No admin or private routes in sitemap
    expect(urls.some((u) => u.includes("/admin"))).toBe(false);
    expect(urls.some((u) => u.includes("/api"))).toBe(false);
    expect(urls.some((u) => u.includes("/quiz-tools"))).toBe(false);
  });
});

describe("Security & Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimit("test-client-ip", "test");
  });

  it("should allow requests under the rate limit and block when threshold is exceeded", () => {
    const opts = { windowMs: 60000, max: 3, keyPrefix: "test" };

    // Request 1
    const res1 = checkRateLimit("test-client-ip", opts);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    // Request 2
    const res2 = checkRateLimit("test-client-ip", opts);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    // Request 3
    const res3 = checkRateLimit("test-client-ip", opts);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);

    // Request 4 -> Should be blocked (429)
    const res4 = checkRateLimit("test-client-ip", opts);
    expect(res4.success).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetTime).toBeGreaterThan(Date.now());
  });
});

describe("CSRF Defense-in-Depth & Domain Canonicalization Middleware", () => {
  it("should validate ret-admin and XMLHttpRequest custom headers and reject absent headers", async () => {
    const { validateCsrfHeader } = await import("@/server/lib/csrf");

    const validReq = {
      headers: new Headers({ "x-requested-with": "ret-admin" }),
    } as any;
    expect(validateCsrfHeader(validReq)).toBe(true);

    const validXhr = {
      headers: new Headers({ "x-requested-with": "XMLHttpRequest" }),
    } as any;
    expect(validateCsrfHeader(validXhr)).toBe(true);

    const invalidReq = {
      headers: new Headers({ "x-requested-with": "other" }),
    } as any;
    expect(validateCsrfHeader(invalidReq)).toBe(false);

    const missingReq = {
      headers: new Headers({}),
    } as any;
    expect(validateCsrfHeader(missingReq)).toBe(false);
  });

  it("should handle canonical domain and external legacy domain requests correctly", async () => {
    const { middleware } = await import("@/middleware");
    const { NextRequest } = await import("next/server");

    const apexReq = new NextRequest("https://rajasthanexamtwister.in/blogs/rajasthan-gk", {
      headers: { host: "rajasthanexamtwister.in" },
    });
    const apexRes = await middleware(apexReq);
    expect(apexRes.status).toBe(200);

    const externalReq = new NextRequest("https://legacy-domain.com/notes/forts", {
      headers: { host: "legacy-domain.com" },
    });
    const externalRes = await middleware(externalReq);
    expect(externalRes.status).toBe(301);
    expect(externalRes.headers.get("location")).toBe("https://rajasthanexamtwister.in/notes/forts");
  });
});


