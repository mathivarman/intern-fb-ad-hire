import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Application from "@/models/Application";
import Applicant from "@/models/Applicant";
import "@/models/Position";
import "@/models/Batch";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const positionId = searchParams.get("positionId") || "";
    const status = searchParams.get("status") || "";
    const language = searchParams.get("language") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    const appFilter: Record<string, unknown> = {};
    if (positionId) appFilter.positionId = positionId;
    if (status) appFilter.status = status;
    if (dateFrom || dateTo) {
      appFilter.appliedDate = {};
      if (dateFrom) (appFilter.appliedDate as Record<string, Date>).$gte = new Date(dateFrom);
      if (dateTo) (appFilter.appliedDate as Record<string, Date>).$lte = new Date(dateTo);
    }

    // Language filter needs applicant lookup
    if (language) {
      const applicants = await Applicant.find({ preferredLanguage: language as "Tamil" | "Sinhala" | "English" }).select("_id");
      const applicantIds = applicants.map((a) => a._id.toString());
      appFilter.applicantId = { $in: applicantIds };
    }

    const applications = await Application.find(appFilter)
      .populate("applicantId", "fullName email phone preferredLanguage educationLevel")
      .populate("positionId", "name department")
      .populate("batchId", "title")
      .sort({ appliedDate: 1, createdAt: 1 });

    return NextResponse.json({ applications });
  } catch {
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
