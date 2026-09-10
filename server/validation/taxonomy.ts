import { z } from "zod";

export const CategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long").optional(),
});

export const TagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(100, "Name too long"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug too long").optional(),
});
