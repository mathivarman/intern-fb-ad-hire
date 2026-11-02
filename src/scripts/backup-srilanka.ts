import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { classifyCountry } from "../lib/utils";
import Applicant from "../models/Applicant";
import Application from "../models/Application";
import CallLog from "../models/CallLog";
import Position from "../models/Position";
import Batch from "../models/Batch";

// Explicit side-effect imports to register schemas in Mongoose
import "../models/Position";
import "../models/Batch";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function runBackup() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  // Reference the models explicitly so TS doesn't optimize/elide the imports
  console.log(`Using models: ${Position.modelName}, ${Batch.modelName}`);

  console.log("Fetching all applicants...");
  const applicants = await Applicant.find({}).lean();
  console.log(`Found ${applicants.length} total applicants in database.`);

  // Filter Sri Lankan applicants
  const sriLankanApplicants = applicants.filter(app => {
    const country = classifyCountry(app.country, app.phone);
    return country === "Sri Lanka";
  });
  console.log(`Filtered down to ${sriLankanApplicants.length} Sri Lankan applicants.`);

  if (sriLankanApplicants.length === 0) {
    console.log("No Sri Lankan applicants found. Exiting.");
    await mongoose.disconnect();
    return;
  }

  const sriLankanApplicantIds = sriLankanApplicants.map(app => app._id);

  console.log("Fetching applications for Sri Lankan applicants...");
  const applications = await Application.find({ applicantId: { $in: sriLankanApplicantIds } })
    .populate("positionId", "name department")
    .populate("batchId", "title")
    .lean();
  console.log(`Found ${applications.length} applications.`);

  const applicationIds = applications.map(app => app._id);

  console.log("Fetching call logs for these applications...");
  const callLogs = await CallLog.find({ applicationId: { $in: applicationIds } }).lean();
  console.log(`Found ${callLogs.length} call logs.`);

  const backupData = {
    backupDate: new Date().toISOString(),
    totalSriLankanApplicants: sriLankanApplicants.length,
    totalSriLankanApplications: applications.length,
    totalCallLogs: callLogs.length,
    applicants: sriLankanApplicants,
    applications: applications,
    callLogs: callLogs
  };

  // Create backups folder if it doesn't exist
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `srilankan_applicants_backup_${timestamp}.json`;
  const filePath = path.join(backupDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`\n🎉 Backup successfully created and saved to:`);
  console.log(`   ${filePath}`);

  await mongoose.disconnect();
}

runBackup().catch(async (err) => {
  console.error("❌ Error running backup:", err);
  await mongoose.disconnect();
});
