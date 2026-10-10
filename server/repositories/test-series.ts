import { connectToDatabase } from "@/server/lib/mongodb";
import { TestSeries, ITestSeries } from "@/server/models/TestSeries";

export class TestSeriesRepository {
  /**
   * List all published test series packages
   */
  static async listPublished(options?: {
    examCategorySlug?: string;
    limit?: number;
  }): Promise<ITestSeries[]> {
    await connectToDatabase();

    const filter: Record<string, any> = { status: "PUBLISHED" };
    if (options?.examCategorySlug && options.examCategorySlug !== "all") {
      const slug = options.examCategorySlug.toLowerCase();
      if (slug === "bci" || slug === "computer-instructor") {
        filter.examCategorySlug = { $in: ["bci", "computer-instructor"] };
      } else if (slug === "reet" || slug === "reet-3rd-grade") {
        filter.examCategorySlug = { $in: ["reet", "reet-3rd-grade"] };
      } else if (slug === "animal-attendant" || slug === "pashu-parichar") {
        filter.examCategorySlug = { $in: ["animal-attendant", "pashu-parichar"] };
      } else {
        filter.examCategorySlug = slug;
      }
    }

    const query = TestSeries.find(filter).sort({ createdAt: -1 });
    if (options?.limit && options.limit > 0) {
      query.limit(options.limit);
    }

    return (await query.lean()) as unknown as ITestSeries[];
  }

  /**
   * Find single test series by slug with populated quiz details
   */
  static async findBySlug(slug: string): Promise<ITestSeries | null> {
    await connectToDatabase();
    const result = await TestSeries.findOne({ slug: slug.toLowerCase(), status: "PUBLISHED" })
      .populate("quizzes.quizId", "title slug subject difficulty questionCount defaultMarks defaultNegativeMarks timeLimitSeconds")
      .lean();

    return result ? ((result as unknown) as ITestSeries) : null;
  }

  /**
   * Find test series by ID
   */
  static async findById(id: string): Promise<ITestSeries | null> {
    await connectToDatabase();
    const result = await TestSeries.findById(id).lean();
    return result ? ((result as unknown) as ITestSeries) : null;
  }
}
