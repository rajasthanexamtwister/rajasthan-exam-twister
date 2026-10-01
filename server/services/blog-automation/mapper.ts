import mongoose from "mongoose";
import { AiArticlePayload, FaqItemPayloadSchema, McqItemPayloadSchema } from "@/server/validation/blog-automation";
import { Category } from "@/server/models/Category";
import { Tag } from "@/server/models/Tag";
import { Media } from "@/server/models/Media";
import { slugify } from "@/server/lib/slugify";
import { CreateBlogInput } from "@/server/validation/blog";
import { sanitizeContentHtml } from "@/server/lib/sanitize";

export class BlogAutomationMapper {
  /**
   * Find or safely create a category for the AI article
   */
  static async resolveCategoryId(categoryName: string): Promise<mongoose.Types.ObjectId | undefined> {
    if (!categoryName) return undefined;
    const cleanName = categoryName.trim();
    const slug = slugify(cleanName);

    try {
      let cat = await Category.findOne({
        $or: [{ slug }, { name: { $regex: new RegExp(`^${cleanName}$`, "i") } }],
      }).exec();

      if (!cat) {
        cat = await Category.create({
          name: cleanName,
          slug,
        });
      }

      return cat._id;
    } catch (err) {
      console.warn("Failed to resolve/create category, checking fallback category:", err);
      const fallback = await Category.findOne().exec();
      return fallback?._id;
    }
  }

  /**
   * Find or safely create tags for the AI article
   */
  static async resolveTagIds(tagNames: string[]): Promise<mongoose.Types.ObjectId[]> {
    if (!Array.isArray(tagNames) || tagNames.length === 0) return [];
    const tagIds: mongoose.Types.ObjectId[] = [];

    for (const name of tagNames) {
      const cleanName = name.trim();
      if (!cleanName) continue;
      const slug = slugify(cleanName);

      try {
        let tag = await Tag.findOne({
          $or: [{ slug }, { name: { $regex: new RegExp(`^${cleanName}$`, "i") } }],
        }).exec();

        if (!tag) {
          tag = await Tag.create({
            name: cleanName,
            slug,
          });
        }

        if (tag?._id) {
          tagIds.push(tag._id);
        }
      } catch (err) {
        console.warn(`Failed to resolve tag '${cleanName}':`, err);
      }
    }

    return tagIds;
  }

  /**
   * Attach or register an AI generated image in Media collection
   */
  static async resolveCoverImageId(image?: {
    imageUrl?: string;
    altText?: string;
    caption?: string;
  }): Promise<mongoose.Types.ObjectId | undefined> {
    if (!image?.imageUrl) return undefined;

    try {
      let media = await Media.findOne({ url: image.imageUrl }).exec();
      if (!media) {
        media = await Media.create({
          url: image.imageUrl,
          altText: image.altText || "Featured Blog Cover Image",
          caption: image.caption || "Rajasthan Exam Twister Featured Image",
          provider: "cloudinary",
          width: 1200,
          height: 675,
          format: "jpg",
        });
      }
      return media?._id;
    } catch (err) {
      console.warn("Failed to register media cover image:", err);
      return undefined;
    }
  }

  /**
   * Combine body HTML with FAQs and MCQs if provided in research
   */
  static buildEnrichedContentHtml(
    baseHtml: string,
    faqs?: Array<{ question: string; answer: string }>,
    mcqs?: Array<{ question: string; options: string[]; correctAnswer: number; explanation: string }>
  ): string {
    let combinedHtml = baseHtml;

    // Append FAQ Accordion/Section if present and not already in HTML
    if (faqs && faqs.length > 0 && !combinedHtml.includes("अक्सर पूछे जाने वाले प्रश्न") && !combinedHtml.includes("FAQ")) {
      let faqSection = `
        <div class="mt-8 pt-6 border-t border-slate-200">
          <h2>अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Questions)</h2>
          <div class="space-y-4 mt-4">
      `;

      faqs.forEach((faq, index) => {
        faqSection += `
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 class="font-bold text-slate-900 text-base">Q${index + 1}. ${faq.question}</h3>
            <p class="text-slate-700 mt-2">${faq.answer}</p>
          </div>
        `;
      });

      faqSection += `
          </div>
        </div>
      `;
      combinedHtml += faqSection;
    }

    // Append Practice MCQs if present and not already in HTML
    if (mcqs && mcqs.length > 0 && !combinedHtml.includes("वस्तुनिष्ठ अभ्यास प्रश्न") && !combinedHtml.includes("MCQ")) {
      let mcqSection = `
        <div class="mt-8 pt-6 border-t border-slate-200">
          <h2>परीक्षा उपयोगी महत्वपूर्ण वस्तुनिष्ठ प्रश्न (Practice MCQs)</h2>
          <div class="space-y-6 mt-4">
      `;

      mcqs.forEach((mcq, index) => {
        mcqSection += `
          <div class="bg-amber-50/50 border border-amber-200/70 rounded-lg p-4">
            <p class="font-bold text-slate-900">प्रश्न ${index + 1}: ${mcq.question}</p>
            <ol class="list-decimal pl-6 mt-2 space-y-1 text-slate-800">
        `;

        mcq.options.forEach((opt, optIndex) => {
          const isCorrect = optIndex === mcq.correctAnswer;
          mcqSection += `
            <li class="${isCorrect ? "font-semibold text-emerald-800" : ""}">${opt} ${isCorrect ? "✓ (सही उत्तर)" : ""}</li>
          `;
        });

        mcqSection += `
            </ol>
            ${mcq.explanation ? `<p class="mt-2 text-xs text-slate-600 bg-white p-2 rounded border border-amber-100"><strong>व्याख्या:</strong> ${mcq.explanation}</p>` : ""}
          </div>
        `;
      });

      mcqSection += `
          </div>
        </div>
      `;
      combinedHtml += mcqSection;
    }

    return sanitizeContentHtml(combinedHtml);
  }

  /**
   * Map AI Article payload into BlogService CreateBlogInput
   */
  static mapToCreateBlogInput(
    payload: AiArticlePayload,
    categoryId?: mongoose.Types.ObjectId,
    tagIds?: mongoose.Types.ObjectId[],
    coverImageId?: mongoose.Types.ObjectId
  ): CreateBlogInput {
    const fullHtml = this.buildEnrichedContentHtml(
      payload.contentHtml,
      payload.research?.faqs,
      payload.research?.mcqs
    );

    return {
      title: payload.title.trim(),
      excerpt: payload.excerpt?.trim() || `${payload.topic} - विस्तृत परीक्षा नोट्स एवं मुख्य विश्लेषण।`,
      content: fullHtml,
      categoryId: categoryId?.toString(),
      tagIds: tagIds?.map((t) => t.toString()) || [],
      coverImageId: coverImageId?.toString(),
      metaTitle: payload.metaTitle?.trim() || `${payload.title} | Rajasthan Exam Twister`,
      metaDescription: payload.metaDescription?.trim() || payload.excerpt?.trim(),
      canonicalUrl: payload.canonicalUrl,
      featured: payload.featured || false,
      author: payload.author || "Rajasthan Exam Twister AI Editorial",
    };
  }
}
