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
});
