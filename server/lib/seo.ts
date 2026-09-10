/**
 * Centralized SEO utilities for Rajasthan Exam Twister
 */

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://rajasthanexamtwister.com";
  return url.replace(/\/$/, "");
}

/**
 * Strips HTML tags and collapses whitespace
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generates an SEO meta description fallback truncated cleanly at a word boundary
 * per SEO.md §2 (~155 characters).
 */
export function generateMetaDescription(
  content?: string,
  metaDescription?: string | null,
  excerpt?: string | null,
  maxLength: number = 155
): string {
  if (metaDescription && metaDescription.trim()) {
    return metaDescription.trim();
  }

  if (excerpt && excerpt.trim()) {
    return excerpt.trim();
  }

  if (!content) {
    return "Rajasthan Exam Twister — High-yield GK handbooks, revision notes, and exam articles for Rajasthan competitive examinations.";
  }

  const plainText = stripHtml(content);
  if (!plainText) {
    return "Rajasthan Exam Twister — High-yield GK handbooks, revision notes, and exam articles for Rajasthan competitive examinations.";
  }

  if (plainText.length <= maxLength) {
    return plainText;
  }

  // Truncate at word boundary around maxLength
  const truncated = plainText.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0 && lastSpace > maxLength - 30) {
    return `${truncated.slice(0, lastSpace)}...`;
  }

  return `${truncated}...`;
}
