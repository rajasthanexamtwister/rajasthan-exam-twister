import { TagRepository } from "@/server/repositories/tag";
import { slugify } from "@/server/lib/slugify";
import { ITag } from "@/server/models/Tag";

export class TagService {
  static async listTags(): Promise<ITag[]> {
    return TagRepository.list();
  }

  static async createTag(name: string, customSlug?: string): Promise<{ success: boolean; tag?: ITag; error?: string }> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "Tag name is required" };
    }

    const slug = customSlug?.trim() || slugify(trimmedName);

    const existing = await TagRepository.findBySlug(slug);
    if (existing) {
      return { success: false, error: `Tag with slug '${slug}' already exists` };
    }

    const tag = await TagRepository.create({ name: trimmedName, slug });
    return { success: true, tag };
  }

  static async deleteTag(id: string): Promise<{ success: boolean; error?: string; status: number }> {
    const deleted = await TagRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Tag not found", status: 404 };
    }

    return { success: true, status: 200 };
  }
}
