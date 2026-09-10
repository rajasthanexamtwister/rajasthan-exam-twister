import slugifyFn from "slugify";

export function slugify(text: string): string {
  if (!text) return "untitled";

  const slug = slugifyFn(text, {
    lower: true,
    strict: true,
    trim: true,
  });

  return slug || "untitled";
}

export async function generateUniqueSlug(
  title: string,
  isSlugTaken: (slug: string) => Promise<boolean>,
  existingSlug?: string
): Promise<string> {
  // If the item already has a slug and it was already published, slug is immutable
  if (existingSlug) {
    return existingSlug;
  }

  const baseSlug = slugify(title);
  let candidate = baseSlug;
  let counter = 2;

  while (await isSlugTaken(candidate)) {
    candidate = `${baseSlug}-${counter}`;
    counter++;
  }

  return candidate;
}
