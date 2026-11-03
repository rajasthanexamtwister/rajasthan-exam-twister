import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICategorySeatBreakdown {
  UR: number;
  EWS: number;
  OBC: number;
  MBC: number;
  SC: number;
  ST: number;
}

export interface IBciSurveyConfig extends Document {
  _id: mongoose.Types.ObjectId;
  exam: string; // "BCI_2026"
  version: number;
  isActive: boolean;

  vacancies: {
    nonTspTotal: number;
    tspTotal: number;
    nonTspCategorySeats: ICategorySeatBreakdown;
    tspCategorySeats: {
      UR: number;
      SC: number;
      ST: number;
    };
  };

  backlogEnabled: boolean;
  backlogSeats: number;
  coverageFraction: number; // default 0.15

  qualifyingThresholds: {
    UR: number;
    EWS: number;
    OBC: number;
    MBC: number;
    SC: number;
    ST: number;
  };

  applicationShares: {
    // Non-TSP category × gender application share baseline
    [key: string]: number;
  };

  minEffectiveSampleSize: number;
  bootstrapIterations: number;

  updatedBy?: string;
  changeDescription?: string;

  createdAt: Date;
  updatedAt: Date;
}

const BciSurveyConfigSchema = new Schema<IBciSurveyConfig>(
  {
    exam: {
      type: String,
      required: true,
      default: "BCI_2026",
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    vacancies: {
      nonTspTotal: { type: Number, default: 2936 },
      tspTotal: { type: Number, default: 693 },
      nonTspCategorySeats: {
        UR: { type: Number, default: 1100 },
        EWS: { type: Number, default: 294 },
        OBC: { type: Number, default: 616 },
        MBC: { type: Number, default: 147 },
        SC: { type: Number, default: 470 },
        ST: { type: Number, default: 309 },
      },
      tspCategorySeats: {
        UR: { type: Number, default: 347 },
        SC: { type: Number, default: 35 },
        ST: { type: Number, default: 311 },
      },
    },
    backlogEnabled: {
      type: Boolean,
      default: false,
    },
    backlogSeats: {
      type: Number,
      default: 0,
    },
    coverageFraction: {
      type: Number,
      default: 0.15,
      min: 0.01,
      max: 1.0,
    },
    qualifyingThresholds: {
      UR: { type: Number, default: 40 },
      EWS: { type: Number, default: 40 },
      OBC: { type: Number, default: 40 },
      MBC: { type: Number, default: 40 },
      SC: { type: Number, default: 35 },
      ST: { type: Number, default: 35 },
    },
    applicationShares: {
      type: Schema.Types.Mixed,
      default: {
        UR_Male: 0.12,
        UR_Female: 0.08,
        EWS_Male: 0.07,
        EWS_Female: 0.03,
        OBC_Male: 0.28,
        OBC_Female: 0.14,
        MBC_Male: 0.04,
        MBC_Female: 0.01,
        SC_Male: 0.11,
        SC_Female: 0.04,
        ST_Male: 0.03,
        ST_Female: 0.02,
      },
    },
    minEffectiveSampleSize: {
      type: Number,
      default: 15,
    },
    bootstrapIterations: {
      type: Number,
      default: 400,
    },
    updatedBy: {
      type: String,
    },
    changeDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const BciSurveyConfig: Model<IBciSurveyConfig> =
  mongoose.models.BciSurveyConfig ||
  mongoose.model<IBciSurveyConfig>("BciSurveyConfig", BciSurveyConfigSchema);

export default BciSurveyConfig;
