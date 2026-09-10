import { z } from "zod";

export const CreateNoteSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300, "Title is too long"),
  content: z.string().default(""),
  subject: z.string().trim().max(150, "Subject too long").optional().nullable(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID").optional().nullable(),
  tagIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid tag ID")).optional().default([]),
  imageIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid media image ID")).optional().default([]),
  pdfMediaId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid PDF media ID").optional().nullable(),
  source: z.string().trim().max(250, "Source too long").optional().nullable(),
});

export const UpdateNoteSchema = CreateNoteSchema.partial();

export const NoteQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "ALL"]).optional(),
  subject: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().optional(),
});

export const BulkNoteActionSchema = z.object({
  noteIds: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid note ID format"))
    .min(1, "At least one note ID is required")
    .max(200, "Cannot process more than 200 notes in a single bulk operation"),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type NoteQueryInput = z.infer<typeof NoteQuerySchema>;
export type BulkNoteActionInput = z.infer<typeof BulkNoteActionSchema>;
