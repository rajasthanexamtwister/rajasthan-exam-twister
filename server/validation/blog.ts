import { z } from "zod";

export const CreateBlogSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(600, "Excerpt cannot exceed 600 characters").optional().nullable(),
  coverImageId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid cover image ID").optional().nullable(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional().nullable(),
  tagIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid tag ID")).optional().default([]),
  metaTitle: z.string().max(160, "Meta title too long").optional().nullable(),
  metaDescription: z.string().max(320, "Meta description too long").optional().nullable(),
  canonicalUrl: z.string().url("Invalid canonical URL").optional().nullable().or(z.literal("")),
  featured: z.boolean().optional().default(false),
  author: z.string().max(100, "Author name too long").optional().nullable(),
});

export const UpdateBlogSchema = CreateBlogSchema.partial();

export const BlogQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
export type BlogQueryInput = z.infer<typeof BlogQuerySchema>;
