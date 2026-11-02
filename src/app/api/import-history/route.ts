import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImportLog from "@/models/ImportLog";
import "@/models/Position";
import "@/models/Batch";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const logs = await ImportLog.find({})
      .populate("positionId", "name department")
      .populate("batchId", "title")
      .sort({ createdAt: -1 });

    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch import history" }, { status: 500 });
  }
}
