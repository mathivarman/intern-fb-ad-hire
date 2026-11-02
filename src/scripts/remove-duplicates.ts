import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function removeDuplicates() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  const db = mongoose.connection.db!;
  const applicationsCol = db.collection("applications");
  const calllogsCol = db.collection("calllogs");
  const applicantsCol = db.collection("applicants");

  console.log("Fetching all applications...");
  const allApplications = await applicationsCol.find({}).toArray();
  console.log(`Found ${allApplications.length} total applications.`);

  // Group applications by applicantId
  const groups = new Map<string, any[]>();
  for (const app of allApplications) {
    if (!app.applicantId) continue;
    const key = app.applicantId.toString();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(app);
  }

  let totalDeletedApps = 0;
  let totalDeletedCallLogs = 0;

  for (const [applicantId, apps] of groups.entries()) {
    if (apps.length <= 1) continue;

    // Fetch applicant name for better logging
    const applicant = await applicantsCol.findOne({ _id: apps[0].applicantId });
    const name = applicant ? applicant.fullName : "Unknown";

    console.log(`\n👥 Applicant: ${name} (${applicantId}) has ${apps.length} applications.`);

    // Sort by appliedDate ascending (earliest first)
    apps.sort((a, b) => {
      const dateA = new Date(a.appliedDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.appliedDate || b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    const keepApp = apps[0];
    const deleteApps = apps.slice(1);

    console.log(`   Keep: Application ID ${keepApp._id} applied on ${keepApp.appliedDate || keepApp.createdAt}`);

    const deleteIds = deleteApps.map(a => a._id);
    
    // Delete applications
    const appDelResult = await applicationsCol.deleteMany({ _id: { $in: deleteIds } });
    totalDeletedApps += appDelResult.deletedCount;
    console.log(`   🗑  Deleted ${appDelResult.deletedCount} duplicate applications.`);

    // Delete associated call logs
    const logDelResult = await calllogsCol.deleteMany({ applicationId: { $in: deleteIds } });
    totalDeletedCallLogs += logDelResult.deletedCount;
    if (logDelResult.deletedCount > 0) {
      console.log(`   🗑  Deleted ${logDelResult.deletedCount} associated call logs.`);
    }
  }

  console.log(`\n=========================================`);
  console.log(`✅ Cleanup finished!`);
  console.log(`🗑  Total applications deleted: ${totalDeletedApps}`);
  console.log(`🗑  Total call logs deleted: ${totalDeletedCallLogs}`);
  console.log(`=========================================`);

  await mongoose.disconnect();
}

removeDuplicates().catch(console.error);
