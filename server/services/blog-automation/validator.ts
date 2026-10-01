import { AiArticlePayload, AiArticlePayloadSchema } from "@/server/validation/blog-automation";
import { sanitizeContentHtml } from "@/server/lib/sanitize";
import { AutomationErrorCode } from "./types";

export interface ValidationResult {
  valid: boolean;
  data?: AiArticlePayload;
  sanitizedHtml?: string;
  errorCode?: AutomationErrorCode;
  errorMessage?: string;
  warnings: string[];
}

export class BlogAutomationValidator {
  /**
   * Validate and sanitize incoming AI generation payload
   */
  static validatePayload(rawPayload: unknown): ValidationResult {
    const warnings: string[] = [];

    // 1. Zod Schema Validation
    const parseResult = AiArticlePayloadSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return {
        valid: false,
        errorCode: "VALIDATION_FAILED",
        errorMessage: `AI payload schema validation failed: ${issueMessage}`,
        warnings,
      };
    }

    const payload = parseResult.data;

    // 2. Editorial QA Check
    if (payload.qa.status !== "PASSED" || payload.qa.score < 70) {
      return {
        valid: false,
        data: payload,
        errorCode: "QA_FAILED",
        errorMessage: `Article failed Editorial QA (Score: ${payload.qa.score}/100, Status: ${payload.qa.status})`,
        warnings: [...warnings, ...payload.qa.warnings],
      };
    }

    // 3. Conflicting Claims Check
    if (payload.research.conflictingClaims && payload.research.conflictingClaims.length > 0) {
      warnings.push(`Article contains ${payload.research.conflictingClaims.length} conflicting claims requiring review.`);
    }

    // 4. HTML Content Sanitization
    const sanitizedHtml = sanitizeContentHtml(payload.contentHtml);
    if (!sanitizedHtml || sanitizedHtml.trim().length < 30) {
      return {
        valid: false,
        errorCode: "VALIDATION_FAILED",
        errorMessage: "Article content is empty or invalid after HTML sanitization.",
        warnings,
      };
    }

    // 5. Check for script/malicious remnants
    if (
      sanitizedHtml.includes("<script") ||
      sanitizedHtml.includes("javascript:") ||
      sanitizedHtml.includes("onerror=") ||
      sanitizedHtml.includes("onload=")
    ) {
      return {
        valid: false,
        errorCode: "VALIDATION_FAILED",
        errorMessage: "Article content contains forbidden script elements or event handlers.",
        warnings,
      };
    }

    // 6. Current Affairs / Time-sensitivity check
    if (payload.isCurrentAffairs) {
      if (!payload.research.sources || payload.research.sources.length === 0) {
        warnings.push("Current affairs article generated without explicit authoritative source references.");
      }
    }

    return {
      valid: true,
      data: payload,
      sanitizedHtml,
      warnings,
    };
  }
}
