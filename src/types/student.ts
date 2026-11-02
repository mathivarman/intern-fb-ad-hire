export type StudentStatus =
  | "New"
  | "Contacted"
  | "No Answer"
  | "Follow Up";

export const STUDENT_STATUSES: StudentStatus[] = [
  "New",
  "Contacted",
  "No Answer",
  "Follow Up",
];

export const DEFAULT_FOLLOWERS = ["None", "Mathi", "Sinthu"];

export const POPULAR_COURSES = [
  "Full Stack Web Development",
  "Python & AI Programming",
  "Digital Marketing & Meta Ads",
  "Graphic Design & UI/UX",
  "Data Analytics & Excel",
  "English for Tech & Business",
];

export interface StudentRecord {
  _id: string;
  name: string;
  tpNumber: string;
  courseName: string;
  status: StudentStatus;
  follower: string;
  email?: string;
  notes?: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

