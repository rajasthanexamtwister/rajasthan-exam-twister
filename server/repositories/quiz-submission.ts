import mongoose from "mongoose";
import { connectToDatabase } from "@/server/lib/mongodb";
import { QuizSubmission, IQuizSubmission, QuizSubmissionStatus } from "@/server/models/QuizSubmission";

export interface CreateSubmissionInput {
  userId: string;
  userEmail?: string;
  userName?: string;
  originalFileName?: string;
  quizTitle: string;
  subject?: string;
  questionCount: number;
  jsonData: any;
  status?: QuizSubmissionStatus;
}

export interface SubmissionFilterOptions {
  status?: QuizSubmissionStatus | "ALL";
  search?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSubmissions {
  submissions: IQuizSubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class QuizSubmissionRepository {
  /**
   * Create a new student quiz submission.
   */
  static async create(data: CreateSubmissionInput): Promise<IQuizSubmission> {
    await connectToDatabase();

    const submission = new QuizSubmission({
      userId: new mongoose.Types.ObjectId(data.userId),
      userEmail: data.userEmail,
      userName: data.userName,
      originalFileName: data.originalFileName,
      quizTitle: data.quizTitle,
      subject: data.subject,
      questionCount: data.questionCount,
      jsonData: data.jsonData,
      status: data.status || "VALID",
    });

    return await submission.save();
  }

  /**
   * Find submission by ID.
   */
  static async findById(id: string): Promise<IQuizSubmission | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return await QuizSubmission.findById(id).exec();
  }

  /**
   * List submissions for a specific student ordered by createdAt desc.
   */
  static async findByUserId(userId: string): Promise<IQuizSubmission[]> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(userId)) return [];

    return await QuizSubmission.find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Paginated submission list for Admin Dashboard.
   */
  static async findAllPaginated(
    options: SubmissionFilterOptions = {}
  ): Promise<PaginatedSubmissions> {
    await connectToDatabase();

    const page = Math.max(1, options.page || 1);
    const pageSize = Math.max(1, Math.min(100, options.pageSize || 10));
    const skip = (page - 1) * pageSize;

    const query: mongoose.FilterQuery<IQuizSubmission> = {};

    if (options.status && options.status !== "ALL") {
      query.status = options.status;
    }

    if (options.userId && mongoose.Types.ObjectId.isValid(options.userId)) {
      query.userId = new mongoose.Types.ObjectId(options.userId);
    }

    if (options.search && options.search.trim() !== "") {
      const searchRegex = new RegExp(options.search.trim(), "i");
      query.$or = [
        { quizTitle: searchRegex },
        { userEmail: searchRegex },
        { userName: searchRegex },
        { subject: searchRegex },
      ];
    }

    const [submissions, total] = await Promise.all([
      QuizSubmission.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .exec(),
      QuizSubmission.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      submissions,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  /**
   * Update submission status.
   */
  static async updateStatus(id: string, status: QuizSubmissionStatus): Promise<IQuizSubmission | null> {
    await connectToDatabase();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return await QuizSubmission.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).exec();
  }
}
