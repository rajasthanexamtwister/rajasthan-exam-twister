import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResearchSource {
  url: string;
  title: string;
  publisher?: string;
  publishDate?: Date;
  snippet?: string;
  confidence?: number;
  isOfficial: boolean;
}

export interface ISeoBrief {
  focusKeywords: string[];
  secondaryKeywords: string[];
  searchIntent?: string;
  metaTitleSuggestion?: string;
  metaDescriptionSuggestion?: string;
}

export interface IInternalLinkSuggestion {
  anchorText: string;
  targetSlug: string;
  reason?: string;
}

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface IMcqItem {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface IBlogResearch extends Document {
  _id: mongoose.Types.ObjectId;
  automationJobId: mongoose.Types.ObjectId;
  blogId?: mongoose.Types.ObjectId;
  externalJobId: string;
  topic: string;
  researchDate: Date;
  sources: IResearchSource[];
  verifiedClaims: string[];
  uncertainClaims: string[];
  conflictingClaims: string[];
  seoBrief: ISeoBrief;
  internalLinks: IInternalLinkSuggestion[];
  faqs: IFaqItem[];
  mcqs: IMcqItem[];
  generationModel: string;
  generatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResearchSourceSchema = new Schema<IResearchSource>(
  {
    url: { type: String, required: true },
    title: { type: String, required: true },
    publisher: String,
    publishDate: Date,
    snippet: String,
    confidence: { type: Number, default: 1.0 },
    isOfficial: { type: Boolean, default: false },
  },
  { _id: false }
);

const SeoBriefSchema = new Schema<ISeoBrief>(
  {
    focusKeywords: [{ type: String, trim: true }],
    secondaryKeywords: [{ type: String, trim: true }],
    searchIntent: String,
    metaTitleSuggestion: String,
    metaDescriptionSuggestion: String,
  },
  { _id: false }
);

const InternalLinkSchema = new Schema<IInternalLinkSuggestion>(
  {
    anchorText: { type: String, required: true },
    targetSlug: { type: String, required: true },
    reason: String,
  },
  { _id: false }
);

const FaqItemSchema = new Schema<IFaqItem>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const McqItemSchema = new Schema<IMcqItem>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const BlogResearchSchema = new Schema<IBlogResearch>(
  {
    automationJobId: {
      type: Schema.Types.ObjectId,
      ref: "BlogAutomationJob",
      required: true,
      index: true,
    },
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      index: true,
    },
    externalJobId: {
      type: String,
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    researchDate: {
      type: Date,
      default: Date.now,
    },
    sources: [ResearchSourceSchema],
    verifiedClaims: [{ type: String }],
    uncertainClaims: [{ type: String }],
    conflictingClaims: [{ type: String }],
    seoBrief: SeoBriefSchema,
    internalLinks: [InternalLinkSchema],
    faqs: [FaqItemSchema],
    mcqs: [McqItemSchema],
    generationModel: {
      type: String,
      default: "antigravity-research-v1",
    },
    generatedBy: {
      type: String,
      default: "rajasthan_exam_blogs",
    },
  },
  {
    timestamps: true,
  }
);

export const BlogResearch: Model<IBlogResearch> =
  mongoose.models.BlogResearch ||
  mongoose.model<IBlogResearch>("BlogResearch", BlogResearchSchema);

export default BlogResearch;
