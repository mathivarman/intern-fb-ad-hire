import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBatch extends Document {
  title: string;
  positionId: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  description?: string;
  createdAt: Date;
}

const BatchSchema = new Schema<IBatch>(
  {
    title: { type: String, required: true, trim: true },
    positionId: { type: Schema.Types.ObjectId, ref: "Position", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const Batch: Model<IBatch> =
  mongoose.models.Batch || mongoose.model<IBatch>("Batch", BatchSchema);

export default Batch;
