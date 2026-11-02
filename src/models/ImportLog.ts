import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImportLog extends Document {
  fileName: string;
  positionId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
  applicantIds: mongoose.Types.ObjectId[];
  applicationIds: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const ImportLogSchema = new Schema<IImportLog>(
  {
    fileName: { type: String, required: true },
    positionId: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    importedCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    applicantIds: [{ type: Schema.Types.ObjectId, ref: "Applicant" }],
    applicationIds: [{ type: Schema.Types.ObjectId, ref: "Application" }],
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const ImportLog: Model<IImportLog> =
  mongoose.models.ImportLog || mongoose.model<IImportLog>("ImportLog", ImportLogSchema);

export default ImportLog;
