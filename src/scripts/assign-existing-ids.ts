import mongoose from "mongoose";
import Applicant from "../models/Applicant";
import Application from "../models/Application";
import Position from "../models/Position";
import Counter from "../models/Counter";
import { getPrefix } from "../lib/internId";

// Side-effect imports to register models in Mongoose
import "../models/Applicant";
import "../models/Application";
import "../models/Position";
import "../models/Counter";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function runMigration() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected successfully!\n");

  console.log("Cleaning up existing Counters...");
  await Counter.deleteMany({});
  console.log("✅ Counters cleaned.\n");

  console.log("Fetching all applications sorted chronologically...");
  const applications = await Application.find({}).sort({ appliedDate: 1, createdAt: 1 });
  console.log(`Found ${applications.length} applications in the database.`);

  const prefixCounters: Record<string, number> = {};
  const applicantIdToInternIdMap = new Map<string, string>();

  let updatedApplicantsCount = 0;
  let updatedApplicationsCount = 0;

  for (const app of applications) {
    const applicantIdStr = app.applicantId.toString();
    
    // Fetch applicant details
    const applicantObj = await Applicant.findById(app.applicantId);
    if (!applicantObj) {
      console.warn(`⚠️ Applicant not found for Application ID: ${app._id}`);
      continue;
    }

    // Fetch position details
    const positionObj = await Position.findById(app.positionId);
    const positionName = positionObj ? positionObj.name : "Software Engineer Intern";
    const prefix = getPrefix(positionName);

    let internId = applicantIdToInternIdMap.get(applicantIdStr);
    
    if (!internId) {
      // Increment counter for this prefix
      prefixCounters[prefix] = (prefixCounters[prefix] || 0) + 1;
      const seqNum = prefixCounters[prefix];
      internId = `${prefix}${String(seqNum).padStart(3, '0')}`;
      
      applicantIdToInternIdMap.set(applicantIdStr, internId);

      // Update Applicant document
      await Applicant.findByIdAndUpdate(app.applicantId, { internId });
      updatedApplicantsCount++;
    }

    // Update Application document
    await Application.findByIdAndUpdate(app._id, { internId });
    updatedApplicationsCount++;

    console.log(`Processed Application [${app._id}] for [${applicantObj.fullName}]: assigned ID = ${internId}`);
  }

  console.log("\nSaving final sequence counters to MongoDB...");
  for (const [prefix, seq] of Object.entries(prefixCounters)) {
    const counterKey = `intern_id_${prefix}`;
    await Counter.create({ _id: counterKey, seq });
    console.log(`- Saved counter for ${counterKey}: seq = ${seq}`);
  }

  console.log(`\n🎉 Migration Complete!`);
  console.log(`- Updated Applicants: ${updatedApplicantsCount}`);
  console.log(`- Updated Applications: ${updatedApplicationsCount}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  mongoose.disconnect();
});
