import mongoose, { Schema, Document, Model } from "mongoose";
import { guessCountryFromPhone } from "@/lib/utils";

export type EducationLevel = "Diploma" | "HND" | "Undergraduate" | "Graduate";
export type PreferredLanguage = "Tamil" | "Sinhala" | "English";

export interface IApplicant extends Document {
  fullName: string;
  email: string;
  phone: string; // normalized: 94XXXXXXXXX
  group?: string;
  linkedin?: string;
  portfolio?: string;
  educationLevel?: EducationLevel;
  preferredLanguage?: PreferredLanguage;
  follower?: "None" | "Mathi" | "Sinthu";
  cvUrl?: string;
  country: string;
  internId?: string;
  createdAt: Date;
}

const ApplicantSchema = new Schema<IApplicant>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    group: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    educationLevel: {
      type: String,
      enum: ["Diploma", "HND", "Undergraduate", "Graduate"],
    },
    preferredLanguage: {
      type: String,
      enum: ["Tamil", "Sinhala", "English"],
    },
    follower: {
      type: String,
      enum: ["None", "Mathi", "Sinthu"],
      default: "None",
    },
    cvUrl: { type: String, trim: true },
    country: { type: String, default: "", trim: true },
    internId: { type: String, trim: true },
  },
  { timestamps: true }
);

// Index for fast duplicate detection
ApplicantSchema.index({ phone: 1 });
ApplicantSchema.index({ email: 1 });
// Compound index for filtered search (follower/language/education filters + name search)
ApplicantSchema.index({ preferredLanguage: 1, follower: 1, educationLevel: 1, fullName: 1 });

const Applicant: Model<IApplicant> =
  mongoose.models.Applicant ||
  mongoose.model<IApplicant>("Applicant", ApplicantSchema);

export default Applicant;
