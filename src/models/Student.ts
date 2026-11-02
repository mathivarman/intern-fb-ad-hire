import mongoose, { Schema, Document, Model } from "mongoose";
import {
  StudentStatus,
  STUDENT_STATUSES,
  DEFAULT_FOLLOWERS,
  POPULAR_COURSES,
} from "@/types/student";

export { STUDENT_STATUSES, DEFAULT_FOLLOWERS, POPULAR_COURSES };
export type { StudentStatus };

export interface IStudent extends Document {
  name: string;
  tpNumber: string;
  courseName: string;
  status: StudentStatus;
  follower: string;
  email?: string;
  notes?: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: [true, "Student name is required"], trim: true },
    tpNumber: { type: String, required: [true, "Contact / TP number is required"], trim: true },
    courseName: { type: String, required: [true, "Course name is required"], trim: true },
    status: {
      type: String,
      enum: STUDENT_STATUSES,
      default: "New",
    },
    follower: {
      type: String,
      default: "None",
      trim: true,
    },
    email: { type: String, trim: true, lowercase: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    source: { type: String, default: "Facebook Ad", trim: true },
  },
  { timestamps: true }
);

StudentSchema.index({ tpNumber: 1 });
StudentSchema.index({ status: 1 });
StudentSchema.index({ follower: 1 });
StudentSchema.index({ courseName: 1 });
StudentSchema.index({ createdAt: -1 });

const Student: Model<IStudent> =
  mongoose.models.Student || mongoose.model<IStudent>("Student", StudentSchema);

export default Student;
