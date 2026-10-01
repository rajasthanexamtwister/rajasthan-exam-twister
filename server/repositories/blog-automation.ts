import mongoose, { FilterQuery } from "mongoose";
import { BlogAutomationJob, IBlogAutomationJob } from "@/server/models/BlogAutomationJob";
import { BlogResearch, IBlogResearch } from "@/server/models/BlogResearch";
import { QueueFilterQuery } from "@/server/validation/blog-automation";

export class BlogAutomationRepository {
  static async findJobById(id: string): Promise<IBlogAutomationJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BlogAutomationJob.findById(id).populate("blogId").exec();
  }

  static async findJobByExternalId(externalJobId: string): Promise<IBlogAutomationJob | null> {
    return BlogAutomationJob.findOne({ externalJobId }).populate("blogId").exec();
  }

  static async findJobByBlogId(blogId: string): Promise<IBlogAutomationJob | null> {
    if (!mongoose.Types.ObjectId.isValid(blogId)) return null;
    return BlogAutomationJob.findOne({ blogId: new mongoose.Types.ObjectId(blogId) }).exec();
  }

  static async createJob(data: Partial<IBlogAutomationJob>): Promise<IBlogAutomationJob> {
    return BlogAutomationJob.create(data);
  }

  static async updateJob(
    id: string,
    update: Partial<IBlogAutomationJob>
  ): Promise<IBlogAutomationJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BlogAutomationJob.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).exec();
  }

  static async updateJobByExternalId(
    externalJobId: string,
    update: Partial<IBlogAutomationJob>
  ): Promise<IBlogAutomationJob | null> {
    return BlogAutomationJob.findOneAndUpdate(
      { externalJobId },
      { $set: update },
      { new: true, runValidators: true }
    ).exec();
  }

  static async listJobs(options: QueueFilterQuery) {
    const {
      page = 1,
      limit = 20,
      scheduleStatus,
      generationStatus,
      articleType,
      search,
      requiresApproval,
    } = options;

    const query: FilterQuery<IBlogAutomationJob> = {};

    if (scheduleStatus) query.scheduleStatus = scheduleStatus;
    if (generationStatus) query.generationStatus = generationStatus;
    if (articleType) query.articleType = articleType;
    if (requiresApproval !== undefined) {
      if (requiresApproval) {
        query.adminApproved = false;
        query.generationStatus = "DRAFT_CREATED";
      } else {
        query.adminApproved = true;
      }
    }

    if (search && search.trim()) {
      query.topic = { $regex: search.trim(), $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      BlogAutomationJob.find(query)
        .sort({ scheduledAt: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("blogId")
        .lean()
        .exec(),
      BlogAutomationJob.countDocuments(query).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      generatedToday,
      drafts,
      qaPassed,
      qaFailed,
      scheduled,
      awaitingApproval,
      published,
      held,
      failed,
      nextScheduled,
      recentErrors,
    ] = await Promise.all([
      BlogAutomationJob.countDocuments({ createdAt: { $gte: todayStart } }).exec(),
      BlogAutomationJob.countDocuments({ generationStatus: "DRAFT_CREATED", scheduleStatus: "UNSCHEDULED" }).exec(),
      BlogAutomationJob.countDocuments({ qaStatus: "PASSED" }).exec(),
      BlogAutomationJob.countDocuments({ qaStatus: "FAILED" }).exec(),
      BlogAutomationJob.countDocuments({ scheduleStatus: "SCHEDULED" }).exec(),
      BlogAutomationJob.countDocuments({ adminApproved: false, generationStatus: "DRAFT_CREATED" }).exec(),
      BlogAutomationJob.countDocuments({ scheduleStatus: "PUBLISHED" }).exec(),
      BlogAutomationJob.countDocuments({ scheduleStatus: "HOLD" }).exec(),
      BlogAutomationJob.countDocuments({
        $or: [{ generationStatus: "FAILED" }, { scheduleStatus: "FAILED" }],
      }).exec(),
      BlogAutomationJob.findOne({
        scheduleStatus: "SCHEDULED",
        scheduledAt: { $gte: new Date() },
      })
        .sort({ scheduledAt: 1 })
        .select("topic scheduledAt articleType")
        .lean()
        .exec(),
      BlogAutomationJob.find({
        errorCode: { $exists: true, $ne: "" },
      })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("topic errorCode errorMessage updatedAt")
        .lean()
        .exec(),
    ]);

    return {
      generatedToday,
      drafts,
      qaPassed,
      qaFailed,
      scheduled,
      awaitingApproval,
      published,
      held,
      failed,
      nextScheduled,
      recentErrors,
    };
  }

  static async findDueJobs(limit: number = 10): Promise<IBlogAutomationJob[]> {
    const now = new Date();
    return BlogAutomationJob.find({
      scheduleStatus: "SCHEDULED",
      scheduledAt: { $lte: now },
    })
      .sort({ scheduledAt: 1 })
      .limit(limit)
      .exec();
  }

  static async lockJobForProcessing(id: string): Promise<IBlogAutomationJob | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return BlogAutomationJob.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), scheduleStatus: "SCHEDULED" },
      { $set: { scheduleStatus: "PROCESSING" } },
      { new: true }
    ).exec();
  }

  static async saveResearch(data: Partial<IBlogResearch>): Promise<IBlogResearch> {
    return BlogResearch.create(data);
  }

  static async findResearchByJobId(jobId: string): Promise<IBlogResearch | null> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) return null;
    return BlogResearch.findOne({ automationJobId: new mongoose.Types.ObjectId(jobId) }).exec();
  }

  static async findResearchByBlogId(blogId: string): Promise<IBlogResearch | null> {
    if (!mongoose.Types.ObjectId.isValid(blogId)) return null;
    return BlogResearch.findOne({ blogId: new mongoose.Types.ObjectId(blogId) }).exec();
  }
}
