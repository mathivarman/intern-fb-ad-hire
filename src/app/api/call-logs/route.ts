import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CallLog from "@/models/CallLog";
import Application from "@/models/Application";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get("applicationId");

    const filter = applicationId ? { applicationId } : {};
    const logs = await CallLog.find(filter).sort({ calledDate: -1 });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Failed to fetch call logs" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { applicationId, calledBy, outcome, notes, calledDate, followUpDate } = body;

    if (!applicationId || !calledBy || !outcome) {
      return NextResponse.json({ error: "applicationId, calledBy, and outcome are required" }, { status: 400 });
    }

    const log = await CallLog.create({ applicationId, calledBy, outcome, notes, calledDate, followUpDate });

    // Update application status based on outcome
    const statusMap: Record<string, string> = {
      "Messaged": "Messaged",
      "Called": "Called",
      "No Response": "No Response",
      "Follow Up": "Follow Up",
    };
    if (statusMap[outcome]) {
      await Application.findByIdAndUpdate(applicationId, { status: statusMap[outcome] });
    }

    return NextResponse.json({ log }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create call log" }, { status: 500 });
  }
}
