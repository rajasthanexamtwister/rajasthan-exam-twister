import { describe, it, expect, vi } from "vitest";
import { CategoryService } from "@/server/services/category-service";
import { CategoryRepository } from "@/server/repositories/category";
import { TagService } from "@/server/services/tag-service";
import { TagRepository } from "@/server/repositories/tag";

describe("Taxonomy (Category & Tag) Business Logic", () => {
  describe("CategoryService", () => {
    it("should reject creation with empty name", async () => {
      const res = await CategoryService.createCategory("   ");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Category name is required");
    });

    it("should block category deletion with 409 if in use by blogs or notes", async () => {
      vi.spyOn(CategoryRepository, "countReferences").mockResolvedValueOnce({
        blogCount: 2,
        noteCount: 1,
      });

      const res = await CategoryService.deleteCategory("65f1234567890abcdef12345");
      expect(res.success).toBe(false);
      expect(res.status).toBe(409);
      expect(res.error).toContain("used by 2 blog(s) and 1 note(s)");
    });

    it("should allow category deletion if not in use by any content", async () => {
      vi.spyOn(CategoryRepository, "countReferences").mockResolvedValueOnce({
        blogCount: 0,
        noteCount: 0,
      });
      vi.spyOn(CategoryRepository, "delete").mockResolvedValueOnce(true);

      const res = await CategoryService.deleteCategory("65f1234567890abcdef12345");
      expect(res.success).toBe(true);
      expect(res.status).toBe(200);
    });
  });

  describe("TagService", () => {
    it("should reject creation with empty name", async () => {
      const res = await TagService.createTag("");
      expect(res.success).toBe(false);
      expect(res.error).toBe("Tag name is required");
    });

    it("should delete tag successfully and return 200", async () => {
      vi.spyOn(TagRepository, "delete").mockResolvedValueOnce(true);

      const res = await TagService.deleteTag("65f1234567890abcdef12345");
      expect(res.success).toBe(true);
      expect(res.status).toBe(200);
    });
  });
});
