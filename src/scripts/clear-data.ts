import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function clearData() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  const db = mongoose.connection.db!;
  
  // Collections to clear
  const collections = ["applicants", "applications", "calllogs", "importlogs"];

  for (const col of collections) {
    try {
      const countBefore = await db.collection(col).countDocuments();
      await db.collection(col).deleteMany({});
      const countAfter = await db.collection(col).countDocuments();
      console.log(`🗑  Cleared ${col}: went from ${countBefore} to ${countAfter} documents.`);
    } catch (err: any) {
      console.log(`❌ Error clearing ${col}: ${err.message}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n✅ All student/applicant data successfully deleted.");
}

clearData().catch(console.error);
