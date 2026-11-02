import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { classifyCountry } from "../lib/utils";
import Applicant from "../models/Applicant";
import Application from "../models/Application";
import CallLog from "../models/CallLog";
import Position from "../models/Position";
import Batch from "../models/Batch";

// Side-effect imports to register models in Mongoose
import "../models/Position";
import "../models/Batch";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function runCleanup() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  console.log("Fetching all data for safety backup...");
  const allApplicants = await Applicant.find({}).lean();
  const allApplications = await Application.find({}).lean();
  const allCallLogs = await CallLog.find({}).lean();

  const backupData = {
    backupDate: new Date().toISOString(),
    applicants: allApplicants,
    applications: allApplications,
    callLogs: allCallLogs
  };

  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `full_backup_before_delete_${timestamp}.json`);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf8");
  console.log(`📁 Saved pre-cleanup full backup to: ${backupPath}\n`);

  // Filtering non-Sri Lankan candidates
  console.log("Identifying non-Sri Lankan applicants...");
  const nonSriLankanApplicants = allApplicants.filter(app => {
    const country = classifyCountry(app.country, app.phone);
    return country !== "Sri Lanka";
  });

  const nonSriLankanApplicantIds = nonSriLankanApplicants.map(app => app._id);
  console.log(`Found ${nonSriLankanApplicants.length} non-Sri Lankan applicants to delete.`);

  if (nonSriLankanApplicants.length === 0) {
    console.log("No non-Sri Lankan applicants found to delete. Exiting.");
    await mongoose.disconnect();
    return;
  }

  // Find applications for these applicants
  const nonSriLankanApplications = await Application.find({ applicantId: { $in: nonSriLankanApplicantIds } }).lean();
  const nonSriLankanApplicationIds = nonSriLankanApplications.map(app => app._id);
  console.log(`Found ${nonSriLankanApplications.length} associated applications to delete.`);

  // Find call logs for these applications
  const nonSriLankanCallLogs = await CallLog.find({ applicationId: { $in: nonSriLankanApplicationIds } }).lean();
  console.log(`Found ${nonSriLankanCallLogs.length} associated call logs to delete.`);

  console.log("\nStarting deletion process...");

  // Delete Call Logs
  if (nonSriLankanApplicationIds.length > 0) {
    const callLogResult = await CallLog.deleteMany({ applicationId: { $in: nonSriLankanApplicationIds } });
    console.log(`🗑  Deleted ${callLogResult.deletedCount} call logs.`);
  }

  // Delete Applications
  if (nonSriLankanApplicantIds.length > 0) {
    const applicationResult = await Application.deleteMany({ applicantId: { $in: nonSriLankanApplicantIds } });
    console.log(`🗑  Deleted ${applicationResult.deletedCount} applications.`);
  }

  // Delete Applicants
  const applicantResult = await Applicant.deleteMany({ _id: { $in: nonSriLankanApplicantIds } });
  console.log(`🗑  Deleted ${applicantResult.deletedCount} applicants.`);

  console.log("\n✅ Deletion finished successfully!");
  console.log(`Total applicants remaining: ${allApplicants.length - nonSriLankanApplicants.length}`);

  await mongoose.disconnect();
}

runCleanup().catch(async (err) => {
  console.error("❌ Error running cleanup:", err);
  await mongoose.disconnect();
});
