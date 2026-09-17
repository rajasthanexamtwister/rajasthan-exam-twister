import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPresence extends Document {
  sessionId: string;
  currentPath: string;
  lastSeenAt: Date;
  firstSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PresenceSchema = new Schema<IPresence>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    currentPath: {
      type: String,
      required: true,
      default: "/",
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    firstSeenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB TTL Index: Automatically expire stale records after 300 seconds (5 minutes)
PresenceSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 300 });

export const Presence: Model<IPresence> =
  mongoose.models.Presence || mongoose.model<IPresence>("Presence", PresenceSchema);
