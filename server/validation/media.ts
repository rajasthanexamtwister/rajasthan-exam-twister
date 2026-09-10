import { z } from "zod";

export const UpdateMediaSchema = z.object({
  altText: z.string().trim().max(300, "Alt text too long").optional(),
  caption: z.string().trim().max(600, "Caption too long").optional().nullable(),
});

export const MediaQuerySchema = z.object({
  q: z.string().optional(),
  mimeType: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(24),
});

export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;
export type MediaQueryInput = z.infer<typeof MediaQuerySchema>;
