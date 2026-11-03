import mongoose, { Schema, Document, Model } from "mongoose";

export type BciArea = "TSP" | "Non-TSP";
export type BciCategory = "UR" | "EWS" | "OBC" | "MBC" | "SC" | "ST";
export type BciGender = "Male" | "Female" | "Other";
export type BciMarksSource =
  | "official_provisional_key"
  | "coaching_key"
  | "self_calculated"
  | "other";
export type BciQualificationStatus =
  | "paper_verified_qualified"
  | "paper_verified_not_qualified"
  | "unverified";
export type BciAdminStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "excluded"
  | "duplicate";

export interface IBciAuditLog {
  action: string;
  performedBy: string;
  timestamp: Date;
  details?: string;
}

export interface IBciSurveySubmission extends Document {
  _id: mongoose.Types.ObjectId;
  exam: string; // "BCI_2026"
  area: BciArea;
  category: BciCategory;
  gender: BciGender;

  paper1Marks: number;
  paper2Marks: number;
  totalMarks: number;

  marksSource: BciMarksSource;
  district?: string;
  shift?: string;
  candidateName?: string;
  mobile?: string; // Private
  rollNumberHash?: string; // SHA-256 for duplicate detection
  editTokenHash: string; // SHA-256 hashed edit token
  clientFingerprintHash?: string;

  qualificationStatus: BciQualificationStatus;
  isValid: boolean;
  isDuplicate: boolean;
  adminStatus: BciAdminStatus;
  adminNotes?: string;

  auditLog: IBciAuditLog[];

  createdAt: Date;
  updatedAt: Date;
}

const BciSurveySubmissionSchema = new Schema<IBciSurveySubmission>(
  {
    exam: {
      type: String,
      required: true,
      default: "BCI_2026",
      index: true,
    },
    area: {
      type: String,
      enum: ["TSP", "Non-TSP"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["UR", "EWS", "OBC", "MBC", "SC", "ST"],
      required: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
      index: true,
    },
    paper1Marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    paper2Marks: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
      index: true,
    },
    marksSource: {
      type: String,
      enum: [
        "official_provisional_key",
        "coaching_key",
        "self_calculated",
        "other",
      ],
      required: true,
      default: "official_provisional_key",
    },
    district: {
      type: String,
      trim: true,
    },
    shift: {
      type: String,
      trim: true,
    },
    candidateName: {
      type: String,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
      select: false, // Ensure candidate privacy by default
    },
    rollNumberHash: {
      type: String,
      index: true,
    },
    editTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientFingerprintHash: {
      type: String,
      index: true,
    },
    qualificationStatus: {
      type: String,
      enum: [
        "paper_verified_qualified",
        "paper_verified_not_qualified",
        "unverified",
      ],
      required: true,
      default: "unverified",
      index: true,
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    adminStatus: {
      type: String,
      enum: ["pending", "approved", "flagged", "excluded", "duplicate"],
      default: "approved",
      index: true,
    },
    adminNotes: {
      type: String,
    },
    auditLog: [
      {
        action: { type: String, required: true },
        performedBy: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-throughput public analytics aggregation
BciSurveySubmissionSchema.index({
  exam: 1,
  area: 1,
  isValid: 1,
  adminStatus: 1,
  totalMarks: -1,
});

BciSurveySubmissionSchema.index({
  exam: 1,
  area: 1,
  category: 1,
  isValid: 1,
  adminStatus: 1,
});

export const BciSurveySubmission: Model<IBciSurveySubmission> =
  mongoose.models.BciSurveySubmission ||
  mongoose.model<IBciSurveySubmission>(
    "BciSurveySubmission",
    BciSurveySubmissionSchema
  );

export default BciSurveySubmission;
