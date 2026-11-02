import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Batch from "@/models/Batch";
import "@/models/Position";

export async function GET() {
  try {
    await connectDB();
    const batches = await Batch.find().populate("positionId", "name department").sort({ createdAt: -1 });
    return NextResponse.json({ batches });
  } catch {
    return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, positionId, startDate, endDate, description } = body;

    if (!title || !positionId || !startDate || !endDate) {
      return NextResponse.json({ error: "Title, position, start date, and end date are required" }, { status: 400 });
    }

    const batch = await Batch.create({ title, positionId, startDate, endDate, description });
    await batch.populate("positionId", "name department");
    return NextResponse.json({ batch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
