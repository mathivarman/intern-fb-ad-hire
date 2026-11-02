import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ApplicationStatus =
  | "New"
  | "Messaged"
  | "No Response"
  | "Follow Up"
  | "Interview"
  | "Confirmed"
  | "Rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "New",
  "Messaged",
  "No Response",
  "Follow Up",
  "Interview",
  "Confirmed",
  "Rejected",
];

export interface IApplication extends Document {
  applicantId: Types.ObjectId;
  positionId: Types.ObjectId;
  batchId: Types.ObjectId;
  status: ApplicationStatus;
  appliedDate: Date;
  interviewDate?: Date;
  notes?: string;
  internId?: string;
  createdAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
  {
    applicantId: { type: Schema.Types.ObjectId, ref: "Applicant", required: true },
    positionId: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    status: {
      type: String,
      enum: ["New", "Messaged", "No Response", "Follow Up", "Interview", "Confirmed", "Rejected"],
      default: "New",
    },
    appliedDate: { type: Date, default: Date.now },
    interviewDate: { type: Date },
    notes: { type: String, trim: true },
    internId: { type: String, trim: true },
  },
  { timestamps: true }
);

ApplicationSchema.index({ applicantId: 1 });
ApplicationSchema.index({ positionId: 1, batchId: 1 });
ApplicationSchema.index({ status: 1, createdAt: -1 });
ApplicationSchema.index({ appliedDate: 1 });
ApplicationSchema.index({ status: 1, applicantId: 1 });

const Application: Model<IApplication> =
  mongoose.models.Application ||
  mongoose.model<IApplication>("Application", ApplicationSchema);

export default Application;
