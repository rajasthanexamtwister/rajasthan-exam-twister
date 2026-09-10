import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISettings extends Document<string> {
  _id: string;
  siteTitle: string;
  siteTagline?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    _id: {
      type: String,
      default: "singleton",
    },
    siteTitle: {
      type: String,
      default: "Rajasthan Exam Twister",
    },
    siteTagline: {
      type: String,
      default: "Rajasthan Competitive Exam Preparation & Master Revision Hub",
    },
    contactEmail: String,
  },
  {
    timestamps: true,
    _id: false,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
