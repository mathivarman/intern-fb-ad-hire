/**
 * Seed Script — IAMS Demo Data
 * Run with: npx tsx src/scripts/seed.ts
 * 
 * Creates:
 * - 1 admin user (admin@apptron.com / admin123)
 * - 7 positions
 * - 4 batches
 * - 25 sample applicants with applications
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/iams";

// ---- Inline schemas to avoid import issues in script context ----
const UserSchema = new mongoose.Schema({ name: String, email: { type: String, unique: true }, password: String, role: String }, { timestamps: true });
const PositionSchema = new mongoose.Schema({ name: String, department: String, description: String, status: { type: String, default: "active" } }, { timestamps: true });
const BatchSchema = new mongoose.Schema({ title: String, positionId: mongoose.Schema.Types.ObjectId, startDate: Date, endDate: Date, description: String }, { timestamps: true });
const ApplicantSchema = new mongoose.Schema({ fullName: String, email: String, phone: String, group: String, educationLevel: String, preferredLanguage: String, follower: String, cvUrl: String }, { timestamps: true });
const ApplicationSchema = new mongoose.Schema({ applicantId: mongoose.Schema.Types.ObjectId, positionId: mongoose.Schema.Types.ObjectId, batchId: mongoose.Schema.Types.ObjectId, status: { type: String, default: "New" }, appliedDate: { type: Date, default: Date.now } }, { timestamps: true });

const User = mongoose.model("User", UserSchema);
const Position = mongoose.model("Position", PositionSchema);
const Batch = mongoose.model("Batch", BatchSchema);
const Applicant = mongoose.model("Applicant", ApplicantSchema);
const Application = mongoose.model("Application", ApplicationSchema);

const POSITIONS = [
  { name: "Frontend Intern", department: "Engineering", description: "React, Next.js development" },
  { name: "Backend Intern", department: "Engineering", description: "Node.js, API development" },
  { name: "Full Stack Intern", department: "Engineering", description: "End-to-end web development" },
  { name: "UI/UX Intern", department: "Design", description: "Figma, user experience design" },
  { name: "Graphic Design Intern", department: "Design", description: "Brand and visual design" },
  { name: "Digital Marketing Intern", department: "Marketing", description: "SEO, social media, content" },
  { name: "HR Intern", department: "Human Resources", description: "Recruitment and HR operations" },
];

const LANGUAGES = ["Tamil", "Sinhala", "English"] as const;
const EDUCATIONS = ["Diploma", "HND", "Undergraduate", "Graduate"] as const;
const STATUSES = ["New", "Called", "Interested", "Interview Scheduled", "Selected", "Rejected", "On Hold"] as const;
const GROUPS = ["Group A", "Group B", "Group C", "Group D"] as const;

const NAMES = [
  "Arun Kumar", "Priya Sharma", "Nimal Perera", "Kavitha Raj", "Sanjay Fernando",
  "Dilini Jayawardena", "Mohamed Farhan", "Thilini Silva", "Rajan Krishnamurthy", "Amali De Silva",
  "Vishwa Karunarathna", "Fathima Nusrath", "Chamara Wickramasinghe", "Nithya Prabhu", "Uditha Bandara",
  "Kasun Rathnayake", "Isuri Madushani", "Tharusha Dissanayake", "Malith Senanayake", "Suresh Balakrishnan",
  "Hashini Weerasinghe", "Dinesh Pathirana", "Lakshmi Arumugam", "Roshan Gunawardena", "Binudi Rajapaksha",
];

function randomPhone(i: number): string {
  return `94${(770000000 + i * 13337).toString().slice(0, 9)}`;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Position.deleteMany({}), Batch.deleteMany({}),
    Applicant.deleteMany({}), Application.deleteMany({}),
  ]);
  console.log("🗑  Cleared existing collections");

  // Admin user
  const hashedPw = await bcrypt.hash("admin123", 12);
  await User.create({ name: "Apptron Admin", email: "admin@apptron.com", password: hashedPw, role: "admin" });
  console.log("👤 Created admin user: admin@apptron.com / admin123");

  // Positions
  const positions = await Position.insertMany(POSITIONS);
  console.log(`📋 Created ${positions.length} positions`);

  // Batches (2 months ago → now)
  const now = new Date();
  const twoMonthsAgo = new Date(now); twoMonthsAgo.setMonth(now.getMonth() - 2);
  const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
  const nextMonth = new Date(now); nextMonth.setMonth(now.getMonth() + 1);

  const batches = await Batch.insertMany([
    { title: "Frontend Internship June 2026", positionId: positions[0]._id, startDate: oneMonthAgo, endDate: nextMonth },
    { title: "Backend Internship May 2026", positionId: positions[1]._id, startDate: twoMonthsAgo, endDate: now },
    { title: "UI/UX Batch June 2026", positionId: positions[3]._id, startDate: oneMonthAgo, endDate: nextMonth },
    { title: "Marketing Internship June 2026", positionId: positions[5]._id, startDate: oneMonthAgo, endDate: nextMonth },
  ]);
  console.log(`📦 Created ${batches.length} batches`);

  // Applicants + Applications
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i];
    const first = name.split(" ")[0].toLowerCase();
    const applicant = await Applicant.create({
      fullName: name,
      email: `${first}${i + 1}@example.com`,
      phone: randomPhone(i),
      group: GROUPS[i % GROUPS.length],
      educationLevel: EDUCATIONS[i % EDUCATIONS.length],
      preferredLanguage: LANGUAGES[i % LANGUAGES.length],
      follower: ["None", "Mathi", "Sinthu", "Sanofer"][i % 4],
    });

    // Create 1-2 applications per applicant
    const position = positions[i % positions.length];
    const batch = batches[i % batches.length];
    const appliedDate = new Date(now);
    appliedDate.setDate(now.getDate() - Math.floor(Math.random() * 60));

    await Application.create({
      applicantId: applicant._id,
      positionId: position._id,
      batchId: batch._id,
      status: STATUSES[i % STATUSES.length],
      appliedDate,
    });

    // Some applicants have a second application
    if (i % 3 === 0) {
      const pos2 = positions[(i + 2) % positions.length];
      const batch2 = batches[(i + 1) % batches.length];
      await Application.create({
        applicantId: applicant._id,
        positionId: pos2._id,
        batchId: batch2._id,
        status: "New",
        appliedDate: new Date(),
      });
    }
  }

  console.log(`👥 Created ${NAMES.length} applicants with applications`);
  console.log("\n🎉 Seed complete!");
  console.log("   Login: admin@apptron.com");
  console.log("   Password: admin123");
  await mongoose.disconnect();
}

seed().catch((err) => { console.error("❌ Seed failed:", err); process.exit(1); });
