import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CallOutcome =
  | "Messaged"
  | "Called"
  | "No Response"
  | "Follow Up";

export interface ICallLog extends Document {
  applicationId: Types.ObjectId;
  calledBy: string;
  outcome: CallOutcome;
  notes?: string;
  calledDate: Date;
  followUpDate?: Date;
  createdAt: Date;
}

const CallLogSchema = new Schema<ICallLog>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    calledBy: { type: String, required: true, trim: true },
    outcome: {
      type: String,
      enum: ["Messaged", "Called", "No Response", "Follow Up"],
      required: true,
    },
    notes: { type: String, trim: true },
    calledDate: { type: Date, default: Date.now },
    followUpDate: { type: Date },
  },
  { timestamps: true }
);

CallLogSchema.index({ applicationId: 1 });

const CallLog: Model<ICallLog> =
  mongoose.models.CallLog || mongoose.model<ICallLog>("CallLog", CallLogSchema);

export default CallLog;
