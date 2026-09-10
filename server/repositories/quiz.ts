import mongoose, { FilterQuery } from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { Quiz, IQuiz, QuizDifficulty } from "@/server/models/Quiz";
import { QuizQuestion } from "@/server/models/QuizQuestion";
import { generateUniqueSlug } from "@/server/lib/slugify";
import { ContentStatus } from "@/server/models/Blog";

export interface QuizFilterOptions {
  status?: ContentStatus | "ALL";
  subject?: string;
  categoryId?: string;
  examTag?: string;
  difficulty?: QuizDifficulty;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedQuizzes {
  quizzes: (IQuiz & { questionCount?: number })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DistinctTagCount {
  name: string;
  slug: string;
  count: number;
}

export class QuizRepository {
  static async list(
    filter: QuizFilterOptions = {},
    isAdmin: boolean = false
  ): Promise<PaginatedQuizzes> {
    await connectToDatabase();

    const page = Math.max(1, filter.page || 1);
    const pageSize = Math.max(1, Math.min(100, filter.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const query: FilterQuery<IQuiz> = {};

    if (!isAdmin) {
      query.status = "PUBLISHED";
    } else if (filter.status && filter.status !== "ALL") {
      query.status = filter.status;
    }

    if (filter.subject) {
      query.subject = new RegExp(`^${filter.subject.trim().replace(/-/g, " ")}$`, "i");
    }

    if (filter.examTag) {
      const normalizedExam = filter.examTag.trim().replace(/-/g, " ");
      query.examTags = { $regex: new RegExp(`^${normalizedExam}$`, "i") };
    }

    if (filter.difficulty) {
      query.difficulty = filter.difficulty;
    }

    if (filter.categoryId && mongoose.Types.ObjectId.isValid(filter.categoryId)) {
      query.categoryId = new mongoose.Types.ObjectId(filter.categoryId);
    }

    if (filter.search && filter.search.trim()) {
      const regex = new RegExp(filter.search.trim(), "i");
      query.$or = [{ title: regex }, { subject: regex }, { examTags: regex }];
    }

    const sortOrder: Record<string, 1 | -1> =
      query.status === "PUBLISHED" ? { publishedAt: -1, createdAt: -1 } : { createdAt: -1 };

    const [rawQuizzes, total] = await Promise.all([
      Quiz.find(query)
        .populate("categoryId", "name slug")
        .sort(sortOrder)
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      Quiz.countDocuments(query),
    ]);

    // Attach question counts
    const quizIds = rawQuizzes.map((q) => q._id);
    const questionCounts = await QuizQuestion.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: "$quizId", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const item of questionCounts) {
      countMap.set(item._id.toString(), item.count);
    }

    const quizzes = rawQuizzes.map((q) => ({
      ...q,
      questionCount: countMap.get(q._id.toString()) || 0,
    })) as unknown as (IQuiz & { questionCount?: number })[];

    return {
      quizzes,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  static async findById(id: string): Promise<IQuiz | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Quiz.findById(id).populate("categoryId", "name slug").exec();
  }

  static async findBySlug(slug: string): Promise<IQuiz | null> {
    await connectToDatabase();
    return Quiz.findOne({ slug: slug.toLowerCase() })
      .populate("categoryId", "name slug")
      .exec();
  }

  static async listDistinctExams(): Promise<DistinctTagCount[]> {
    await connectToDatabase();
    const result = await Quiz.aggregate([
      { $match: { status: "PUBLISHED", examTags: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$examTags" },
      { $group: { _id: "$examTags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);

    return result.map((item) => ({
      name: item._id,
      slug: item._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      count: item.count,
    }));
  }

  static async listDistinctSubjects(): Promise<DistinctTagCount[]> {
    await connectToDatabase();
    const result = await Quiz.aggregate([
      { $match: { status: "PUBLISHED", subject: { $exists: true, $ne: "" } } },
      { $group: { _id: "$subject", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);

    return result.map((item) => ({
      name: item._id,
      slug: item._id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      count: item.count,
    }));
  }

  static async incrementAttemptCount(id: string): Promise<void> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await Quiz.findByIdAndUpdate(id, { $inc: { attemptCount: 1 } }).exec();
  }

  static async create(data: {
    title: string;
    subject?: string;
    categoryId?: string | null;
    examTags?: string[];
    difficulty?: QuizDifficulty;
    status?: ContentStatus;
    timeLimitSeconds?: number | null;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    maxAttempts?: number | null;
    defaultMarks?: number;
    defaultNegativeMarks?: number;
  }): Promise<IQuiz> {
    await connectToDatabase();

    const slug = await generateUniqueSlug(data.title, async (candidate) => {
      const existing = await Quiz.findOne({ slug: candidate });
      return !!existing;
    });

    const quiz = new Quiz({
      ...data,
      slug,
      examTags: data.examTags || [],
      difficulty: data.difficulty || "medium",
      attemptCount: 0,
      status: data.status || "DRAFT",
      categoryId:
        data.categoryId && mongoose.Types.ObjectId.isValid(data.categoryId)
          ? new mongoose.Types.ObjectId(data.categoryId)
          : undefined,
    });

    return quiz.save();
  }

  static async update(
    id: string,
    data: Partial<{
      title: string;
      subject: string;
      categoryId: string | null;
      examTags: string[];
      difficulty: QuizDifficulty;
      attemptCount: number;
      status: ContentStatus;
      timeLimitSeconds: number | null;
      shuffleQuestions: boolean;
      shuffleOptions: boolean;
      maxAttempts: number | null;
      defaultMarks: number;
      defaultNegativeMarks: number;
      publishedAt: Date;
    }>
  ): Promise<IQuiz | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const updatePayload: Record<string, unknown> = { ...data };
    if (data.categoryId !== undefined) {
      updatePayload.categoryId =
        data.categoryId && mongoose.Types.ObjectId.isValid(data.categoryId)
          ? new mongoose.Types.ObjectId(data.categoryId)
          : null;
    }

    return Quiz.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true, runValidators: true }
    )
      .populate("categoryId", "name slug")
      .exec();
  }

  static async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const quizObjectId = new mongoose.Types.ObjectId(id);
    await Promise.all([
      Quiz.findByIdAndDelete(id),
      QuizQuestion.deleteMany({ quizId: quizObjectId }),
    ]);

    return true;
  }
}
