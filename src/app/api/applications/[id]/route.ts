import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Application from "@/models/Application";
import "@/models/Position";
import "@/models/Batch";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { status, notes, interviewDate } = await req.json();

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (interviewDate !== undefined) update.interviewDate = interviewDate;

    const application = await Application.findByIdAndUpdate(id, update, { new: true })
      .populate("positionId", "name")
      .populate("batchId", "title");

    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ application });
  } catch (err) {
    console.error("Error patching application:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
