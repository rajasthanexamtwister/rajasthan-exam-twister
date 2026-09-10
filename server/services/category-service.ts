import { CategoryRepository } from "@/server/repositories/category";
import { slugify } from "@/server/lib/slugify";
import { ICategory } from "@/server/models/Category";

export class CategoryService {
  static async listCategories(): Promise<ICategory[]> {
    return CategoryRepository.list();
  }

  static async createCategory(name: string, customSlug?: string): Promise<{ success: boolean; category?: ICategory; error?: string }> {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: "Category name is required" };
    }

    const slug = customSlug?.trim() || slugify(trimmedName);

    const existing = await CategoryRepository.findBySlug(slug);
    if (existing) {
      return { success: false, error: `Category with slug '${slug}' already exists` };
    }

    const category = await CategoryRepository.create({ name: trimmedName, slug });
    return { success: true, category };
  }

  static async updateCategory(id: string, name?: string, customSlug?: string): Promise<{ success: boolean; category?: ICategory; error?: string }> {
    const updateData: { name?: string; slug?: string } = {};

    if (name !== undefined) {
      updateData.name = name.trim();
      if (!updateData.name) {
        return { success: false, error: "Category name cannot be empty" };
      }
    }

    if (customSlug !== undefined) {
      updateData.slug = slugify(customSlug);
    } else if (name) {
      updateData.slug = slugify(name);
    }

    const updated = await CategoryRepository.update(id, updateData);
    if (!updated) {
      return { success: false, error: "Category not found" };
    }

    return { success: true, category: updated };
  }

  static async deleteCategory(id: string): Promise<{ success: boolean; error?: string; status: number }> {
    const { blogCount, noteCount } = await CategoryRepository.countReferences(id);

    if (blogCount > 0 || noteCount > 0) {
      return {
        success: false,
        error: `Cannot delete category: it is currently used by ${blogCount} blog(s) and ${noteCount} note(s). Please reassign or delete those items first.`,
        status: 409,
      };
    }

    const deleted = await CategoryRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Category not found", status: 404 };
    }

    return { success: true, status: 200 };
  }
}
