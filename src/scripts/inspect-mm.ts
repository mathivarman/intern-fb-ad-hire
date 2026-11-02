import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB:", MONGODB_URI);

  const Applicant = mongoose.model("Applicant", new mongoose.Schema({}, { strict: false }));
  const Application = mongoose.model("Application", new mongoose.Schema({}, { strict: false }));

  const applicant = await Applicant.findOne({ email: "mm@gmail.com" });
  if (applicant) {
    console.log("Found Applicant:", applicant);
    const applications = await Application.find({ applicantId: applicant._id });
    console.log(`Found ${applications.length} applications for this applicant:`, applications);
  } else {
    console.log("Applicant with email mm@gmail.com NOT found in database.");
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
