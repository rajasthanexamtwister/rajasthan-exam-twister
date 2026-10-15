import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import nextConfig from "@/next.config.mjs";

describe("Google AdSense & Content Security Policy Audit", () => {
  it("should have correct CSP headers in next.config.mjs allowing Google AdSense and SODAR endpoints", async () => {
    expect(typeof nextConfig.headers).toBe("function");
    const headersConfig = await nextConfig.headers!();
    const globalHeaderRule = headersConfig.find((h: any) => h.source === "/:path*");
    expect(globalHeaderRule).toBeDefined();

    const cspHeader = globalHeaderRule?.headers.find((h: any) => h.key === "Content-Security-Policy");
    expect(cspHeader).toBeDefined();

    const cspValue = cspHeader?.value || "";

    // Verify connect-src contains necessary Google ad traffic endpoints
    expect(cspValue).toContain("connect-src");
    expect(cspValue).toContain("https://ep1.adtrafficquality.google");
    expect(cspValue).toContain("https://ep2.adtrafficquality.google");
    expect(cspValue).toContain("https://pagead2.googlesyndication.com");
    expect(cspValue).toContain("https://googleads.g.doubleclick.net");
    expect(cspValue).toContain("https://www.google-analytics.com");

    // Verify script-src contains necessary Google AdSense, Tag Manager, and SODAR script domains
    expect(cspValue).toContain("script-src");
    expect(cspValue).toContain("https://pagead2.googlesyndication.com");
    expect(cspValue).toContain("https://googleads.g.doubleclick.net");
    expect(cspValue).toContain("https://tpc.googlesyndication.com");
    expect(cspValue).toContain("https://www.googletagservices.com");
    expect(cspValue).toContain("https://www.googletagmanager.com");
    expect(cspValue).toContain("https://ep1.adtrafficquality.google");
    expect(cspValue).toContain("https://ep2.adtrafficquality.google");

    // Verify frame-src contains necessary iframe sources
    expect(cspValue).toContain("frame-src");
    expect(cspValue).toContain("https://googleads.g.doubleclick.net");
    expect(cspValue).toContain("https://tpc.googlesyndication.com");
    expect(cspValue).toContain("https://pagead2.googlesyndication.com");
    expect(cspValue).toContain("https://ep1.adtrafficquality.google");
    expect(cspValue).toContain("https://ep2.adtrafficquality.google");

    // Verify security constraints: no wildcard '*' in connect-src or script-src
    expect(cspValue).not.toMatch(/connect-src[^;]*\*/);
    expect(cspValue).not.toMatch(/script-src[^;]*\*/);
  });

  it("should verify ads.txt exists with valid Google publisher ID and formatting", () => {
    const adsTxtPath = path.join(process.cwd(), "public", "ads.txt");
    expect(fs.existsSync(adsTxtPath)).toBe(true);

    const content = fs.readFileSync(adsTxtPath, "utf-8").trim();
    // Google AdSense format: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
    expect(content).toBe("google.com, pub-8986858563387447, DIRECT, f08c47fec0942fa0");
  });

  it("should verify layout file contains consistent publisher ID and no duplicate scripts", () => {
    const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
    const layoutContent = fs.readFileSync(layoutPath, "utf-8");

    // Publisher ID consistency
    expect(layoutContent).toContain("pub-8986858563387447");
    expect(layoutContent).toContain("google-adsense-account");
    expect(layoutContent).toContain("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8986858563387447");

    // Verify exactly one AdSense script tag
    const scriptOccurrences = (layoutContent.match(/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/g) || []).length;
    expect(scriptOccurrences).toBe(1);
  });

  it("should verify no prohibited ad labels exist in blog and note templates", () => {
    const blogPageContent = fs.readFileSync(
      path.join(process.cwd(), "app", "(public)", "blogs", "[slug]", "page.tsx"),
      "utf-8"
    );
    const notePageContent = fs.readFileSync(
      path.join(process.cwd(), "app", "(public)", "notes", "[slug]", "page.tsx"),
      "utf-8"
    );

    // Google AdSense policy forbids misleading ad labels such as "Recommended For You"
    expect(blogPageContent).not.toContain('label="Recommended For You"');
    expect(notePageContent).not.toContain('label="Recommended For You"');
  });

  it("should verify noindex layouts exist for private and interactive routes", () => {
    const profileLayoutPath = path.join(process.cwd(), "app", "(public)", "profile", "layout.tsx");
    const attemptLayoutPath = path.join(
      process.cwd(),
      "app",
      "(public)",
      "quizzes",
      "[slug]",
      "attempt",
      "layout.tsx"
    );
    const resultLayoutPath = path.join(
      process.cwd(),
      "app",
      "(public)",
      "quizzes",
      "[slug]",
      "result",
      "layout.tsx"
    );

    expect(fs.existsSync(profileLayoutPath)).toBe(true);
    expect(fs.existsSync(attemptLayoutPath)).toBe(true);
    expect(fs.existsSync(resultLayoutPath)).toBe(true);

    const profileContent = fs.readFileSync(profileLayoutPath, "utf-8");
    const attemptContent = fs.readFileSync(attemptLayoutPath, "utf-8");
    const resultContent = fs.readFileSync(resultLayoutPath, "utf-8");

    expect(profileContent).toContain("index: false");
    expect(profileContent).toContain("follow: false");
    expect(attemptContent).toContain("index: false");
    expect(attemptContent).toContain("follow: false");
    expect(resultContent).toContain("index: false");
    expect(resultContent).toContain("follow: false");
  });

  it("should verify 301 redirect for malformed blog slug 2026-27 in next.config.mjs", async () => {
    expect(typeof nextConfig.redirects).toBe("function");
    const redirects = await nextConfig.redirects!();
    const blogRedirect = redirects.find((r: any) => r.source === "/blogs/2026-27");
    expect(blogRedirect).toBeDefined();
    expect(blogRedirect?.destination).toBe("/blogs/cm-anuprati-coaching-yojana-2026-27");
    expect(blogRedirect?.permanent).toBe(true);

    // Verify all malformed slug redirects
    const khanijRedirect = redirects.find((r: any) => r.source === "/blogs/rajasthan-ke-khanij-khanij-ke-kaka");
    expect(khanijRedirect?.destination).toBe("/blogs/rajasthan-ke-khanij-sansadhan-guide");
    expect(khanijRedirect?.permanent).toBe(true);

    const prajamandalRedirect = redirects.find((r: any) => r.source === "/blogs/rajasthan-ke-ka-ki-ka");
    expect(prajamandalRedirect?.destination).toBe("/blogs/rajasthan-prajamandal-andolan-timeline");

    const polityRedirect = redirects.find((r: any) => r.source === "/blogs/rajasthan-polity-polity-ka");
    expect(polityRedirect?.destination).toBe("/blogs/rajasthan-polity-complete-guide");

    const krantiRedirect = redirects.find((r: any) => r.source === "/blogs/1857-ki-rajasthan-ka-ka");
    expect(krantiRedirect?.destination).toBe("/blogs/1857-kranti-rajasthan-contribution");

    const nrityaRedirect = redirects.find((r: any) => r.source === "/blogs/rajasthan-ke-lok-nritya-ka-nritya");
    expect(nrityaRedirect?.destination).toBe("/blogs/rajasthan-ke-lok-nritya-complete-guide");

    const ldcRedirect = redirects.find((r: any) => r.source === "/blogs/rsmssb-ldc-2026-score-card-out-download-link");
    expect(ldcRedirect?.destination).toBe("/blogs/rssb-ldc-score-card-2026-out-check-marks-direct-link");

    const cetRedirect = redirects.find((r: any) => r.source === "/blogs/rajasthan-cet-graduate-level-form-reopen-status-rssb-update");
    expect(cetRedirect?.destination).toBe("/blogs/rajasthan-cet-2026-ke-syllabus-preparation");

    const melaRedirect = redirects.find((r: any) => r.source === "/notes/rajasthan-lok-sanskriti-mela-tyohar-master-handbook");
    expect(melaRedirect?.destination).toBe("/notes/rajasthan-mela-tyohar-combined");
  });
});

