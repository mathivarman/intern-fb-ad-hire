import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPosition extends Document {
  name: string;
  department: string;
  description?: string;
  status: "active" | "inactive";
  createdAt: Date;
}

const PositionSchema = new Schema<IPosition>(
  {
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

const Position: Model<IPosition> =
  mongoose.models.Position || mongoose.model<IPosition>("Position", PositionSchema);

export default Position;
