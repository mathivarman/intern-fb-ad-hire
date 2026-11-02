import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Application from "@/models/Application";
import CallLog from "@/models/CallLog";
import "@/models/Position";
import "@/models/Batch";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const [applicant, applications] = await Promise.all([
      Applicant.findById(id),
      Application.find({ applicantId: id })
        .populate("positionId", "name department")
        .populate("batchId", "title startDate endDate")
        .sort({ createdAt: -1 }),
    ]);
    if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const applicationIds = applications.map((a) => a._id);
    const callLogs = await CallLog.find({ applicationId: { $in: applicationIds } })
      .sort({ calledDate: -1 });

    return NextResponse.json({ applicant, applications, callLogs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch applicant" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    
    const { applicationId, positionId, batchId, ...applicantData } = body;

    const applicant = await Applicant.findByIdAndUpdate(id, applicantData, { new: true });
    if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let application = null;
    if (applicationId && (positionId || batchId)) {
      const updateData: Record<string, unknown> = {};
      if (positionId) updateData.positionId = positionId;
      if (batchId) updateData.batchId = batchId;
      application = await Application.findByIdAndUpdate(applicationId, updateData, { new: true });
    }

    return NextResponse.json({ applicant, application });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update applicant" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const applicant = await Applicant.findById(id);
    if (!applicant) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Find all applications for this applicant, then delete related call logs
    const applications = await Application.find({ applicantId: id });
    const applicationIds = applications.map((a) => a._id);

    await Promise.all([
      CallLog.deleteMany({ applicationId: { $in: applicationIds } }),
      Application.deleteMany({ applicantId: id }),
      Applicant.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete applicant" }, { status: 500 });
  }
}

