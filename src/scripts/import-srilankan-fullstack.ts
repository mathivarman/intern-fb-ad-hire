import mongoose from "mongoose";
import Applicant from "../models/Applicant";
import Application from "../models/Application";
import Position from "../models/Position";
import Batch from "../models/Batch";
import { normalizePhone } from "../lib/normalizePhone";

// Side-effect imports to register models in Mongoose
import "../models/Position";
import "../models/Batch";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

const CANDIDATES = [
  {
    fullName: "Kunasekaram Nithes",
    email: "nitheskunasekaram@gmail.com",
    phone: "0755010684",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Kenuja Sarveswaran",
    email: "kenujakenu26@gmail.com",
    phone: "0786883966",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Muhammathu Abthul Jamal Fathima Shibra",
    email: "shibrajamal918@gmail.com",
    phone: "0759913531",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Kirusnavelu Sinthujan",
    email: "sksinthi15@gmail.com",
    phone: "0750662237",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Hameetha sanofer Hameed naththar",
    email: "hameethasanofer610@gmail.com",
    phone: "0703101014",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Fathima Shafeeka",
    email: "fathimasfq@gmail.com",
    phone: "0761558321",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "MM Mahdhe",
    email: "mmmahdhe@gmail.com",
    phone: "0766395990",
    educationLevel: "Graduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Monishan Sangaralingam",
    email: "monishansangaralingam@gmail.com",
    phone: "0762998130",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Konesan Sinthujan",
    email: "sinthusham09@gmail.com",
    phone: "0768588728",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "MOHAMED IZADEEN MOHAMED AKRAM",
    email: "AKRAMIZADEEN99@GMAIL.COM",
    phone: "0770518378",
    educationLevel: "Graduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "M.I.Fathima Ihsana",
    email: "ihsnf19@gmail.com",
    phone: "0777436164",
    educationLevel: "Graduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Fathima Hishma",
    email: "hishmahish13@gmail.com",
    phone: "0784280173",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Pradhikshalini Mahendran",
    email: "mahendranpradhikshalini@gmail.com",
    phone: "0703352231",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Mohamed Anas",
    email: "mhm.anas06@gmail.com",
    phone: "0774379764",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Thevapalan Kobitharsan",
    email: "kobitharsan@gmail.com",
    phone: "0770431956",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Fathima Afra Nizar",
    email: "afrafathima7744@gmail.com",
    phone: "0741576708",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "KALEELUL RAHMAN MOHAMED SATHAM",
    email: "sathamkaleel@gmail.com",
    phone: "0775008136",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Abdul Munaf Sakeeb",
    email: "sahipsahip99@gmail.com",
    phone: "0771469074",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Abdul Nazar Mohamed Najaf",
    email: "mohamednajaf719@gmail.com",
    phone: "0765784633",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Fathima Seefa",
    email: "fathimasheefa09@gmail.com",
    phone: "0760561778",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  },
  {
    fullName: "Nadarasa Nitharshana",
    email: "shananitharshana2000@gmail.com",
    phone: "0778144869",
    educationLevel: "Undergraduate",
    preferredLanguage: "Tamil"
  }
];

async function importCandidates() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  // 1. Find Position "Full Stack Intern"
  const position = await Position.findOne({ name: "Full Stack Intern", department: "Engineering" });
  if (!position) {
    console.error("❌ Position 'Full Stack Intern' not found in database.");
    await mongoose.disconnect();
    return;
  }
  console.log(`Found Position: ${position.name} (ID: ${position._id})`);

  // 2. Find or Create Batch "None"
  let batch = await Batch.findOne({ title: "None", positionId: position._id });
  if (!batch) {
    console.log("Batch 'None' not found. Creating it...");
    batch = await Batch.create({
      title: "None",
      positionId: position._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months from now
      description: "Default batch for unscheduled or direct candidate imports"
    });
    console.log(`✅ Created Batch: ${batch.title} (ID: ${batch._id})`);
  } else {
    console.log(`Found Batch: ${batch.title} (ID: ${batch._id})`);
  }

  let importedCount = 0;
  let skippedCount = 0;

  for (const c of CANDIDATES) {
    const normalized = normalizePhone(c.phone);

    // Check if applicant already exists in DB
    let applicant = await Applicant.findOne({
      $or: [
        { email: c.email.toLowerCase() },
        { phone: normalized }
      ]
    });

    if (!applicant) {
      applicant = await Applicant.create({
        fullName: c.fullName,
        email: c.email.toLowerCase(),
        phone: normalized,
        country: "Sri Lanka",
        educationLevel: c.educationLevel as any,
        preferredLanguage: c.preferredLanguage as any,
        follower: "None"
      });
      console.log(`👤 Created Applicant: ${applicant.fullName}`);
    } else {
      console.log(`ℹ️ Applicant already exists: ${applicant.fullName}`);
    }

    // Check if application for this applicant and position already exists
    const existingApp = await Application.findOne({
      applicantId: applicant._id,
      positionId: position._id
    });

    if (!existingApp) {
      const application = await Application.create({
        applicantId: applicant._id,
        positionId: position._id,
        batchId: batch._id,
        status: "Confirmed",
        appliedDate: new Date()
      });
      console.log(`📄 Created Application: ID ${application._id} with status "Confirmed"`);
      importedCount++;
    } else {
      console.log(`⚠️ Application already exists for: ${applicant.fullName}`);
      skippedCount++;
    }
  }

  console.log(`\n=========================================`);
  console.log(`✅ Import finished!`);
  console.log(`👤 Total imported applications: ${importedCount}`);
  console.log(`⚠️ Total skipped duplicate applications: ${skippedCount}`);
  console.log(`=========================================`);

  await mongoose.disconnect();
}

importCandidates().catch(async (err) => {
  console.error("❌ Error running import:", err);
  await mongoose.disconnect();
});
