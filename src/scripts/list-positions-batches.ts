import mongoose from "mongoose";
import Position from "../models/Position";
import Batch from "../models/Batch";

// Side-effect imports to register models in Mongoose
import "../models/Position";
import "../models/Batch";

const MONGODB_URI = "mongodb+srv://apptronorders_db_user:apptronorders@cluster0.fdqjjup.mongodb.net/iams?retryWrites=true&w=majority&appName=Cluster0";

async function listAll() {
  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected!\n");

  const positions = await Position.find({});
  console.log("Positions in DB:");
  positions.forEach(p => {
    console.log(`- ID: ${p._id}, Name: ${p.name}, Department: ${p.department}, Status: ${p.status}`);
  });

  const batches = await Batch.find({});
  console.log("\nBatches in DB:");
  batches.forEach(b => {
    console.log(`- ID: ${b._id}, Title: ${b.title}, PositionID: ${b.positionId}`);
  });

  await mongoose.disconnect();
}

listAll().catch(console.error);
