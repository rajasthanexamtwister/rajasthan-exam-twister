import { describe, it, expect } from "vitest";
import { LoginSchema } from "@/server/validation/auth";
import { z } from "zod";

describe("Auth Validation", () => {
  it("should validate correct login payload", () => {
    const validData = {
      email: "admin@rajasthanexamtwister.com",
      password: "securePassword123",
    };
    const result = LoginSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email format", () => {
    const invalidData = {
      email: "not-an-email",
      password: "securePassword123",
    };
    const result = LoginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject short password", () => {
    const invalidData = {
      email: "admin@rajasthanexamtwister.com",
      password: "123",
    };
    const result = LoginSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe("Search Query Validation", () => {
  it("should validate valid search query parameters", () => {
    const SearchParamsSchema = z.object({
      q: z.string().trim().min(1, "Search query is required and cannot be empty").max(200, "Query too long"),
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(50).default(20),
    });

    const valid = SearchParamsSchema.safeParse({ q: "Rajasthan GK", page: "2", pageSize: "10" });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.q).toBe("Rajasthan GK");
      expect(valid.data.page).toBe(2);
      expect(valid.data.pageSize).toBe(10);
    }
  });

  it("should reject empty or whitespace-only search queries", () => {
    const SearchParamsSchema = z.object({
      q: z.string().trim().min(1, "Search query is required and cannot be empty").max(200, "Query too long"),
    });

    expect(SearchParamsSchema.safeParse({ q: "" }).success).toBe(false);
    expect(SearchParamsSchema.safeParse({ q: "   " }).success).toBe(false);
  });
});
