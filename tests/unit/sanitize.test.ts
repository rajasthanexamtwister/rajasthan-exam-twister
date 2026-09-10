import { describe, it, expect } from "vitest";
import { sanitizeContentHtml, calculateReadingTime } from "@/server/lib/sanitize";

describe("HTML Sanitization & Reading Time", () => {
  it("should strip malicious script tags and inline event handlers", () => {
    const dirtyHtml = `
      <h2>Exam Strategy</h2>
      <p>Here is some text</p>
      <script>alert('malicious')</script>
      <img src="https://example.com/pic.jpg" onerror="alert('xss')" alt="Exam Chart" />
      <a href="javascript:alert('steal_cookie')">Click here</a>
    `;

    const clean = sanitizeContentHtml(dirtyHtml);

    expect(clean).toContain("<h2>Exam Strategy</h2>");
    expect(clean).toContain("<p>Here is some text</p>");
    expect(clean).not.toContain("<script>");
    expect(clean).not.toContain("alert('malicious')");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
    expect(clean).toContain('alt="Exam Chart"');
  });

  it("should strip iframes, objects, and embeds", () => {
    const dirtyHtml = `
      <p>Video below:</p>
      <iframe src="https://evil.com/payload"></iframe>
      <object data="evil.swf"></object>
    `;

    const clean = sanitizeContentHtml(dirtyHtml);
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("<object");
  });

  it("should calculate reading time accurately (~200 wpm)", () => {
    const text200Words = new Array(200).fill("word").join(" ");
    const html = `<p>${text200Words}</p>`;
    expect(calculateReadingTime(html)).toBe(1);

    const text500Words = new Array(500).fill("rajasthan").join(" ");
    const html500 = `<div>${text500Words}</div>`;
    expect(calculateReadingTime(html500)).toBe(3); // 500 / 200 = 2.5 -> ceil = 3
  });

  it("should demote h1 to h2 in content to enforce single-h1 heading discipline", () => {
    const raw = "<h1>Main Section Heading</h1><p>Paragraph</p>";
    const clean = sanitizeContentHtml(raw);
    expect(clean).toContain("<h2>Main Section Heading</h2>");
    expect(clean).not.toContain("<h1>");
  });
});

