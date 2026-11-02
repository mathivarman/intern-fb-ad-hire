import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ImportLog from "@/models/ImportLog";
import Application from "@/models/Application";
import Applicant from "@/models/Applicant";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const log = await ImportLog.findById(id);
    if (!log) {
      return NextResponse.json({ error: "Import log not found" }, { status: 404 });
    }

    // 1. Find which applicants from this import have other applications remaining
    const applicantsWithOtherApps = await Application.distinct("applicantId", {
      applicantId: { $in: log.applicantIds },
      _id: { $nin: log.applicationIds },
    });

    const applicantsWithOtherAppsSet = new Set(
      applicantsWithOtherApps.map((id) => id.toString())
    );

    const applicantsToDelete = log.applicantIds.filter(
      (id) => !applicantsWithOtherAppsSet.has(id.toString())
    );

    // 2. Delete all applications created during this import
    const appDeleteRes = await Application.deleteMany({
      _id: { $in: log.applicationIds },
    });

    // 3. Rollback newly created applicants if they have no other applications remaining
    let deletedApplicantsCount = 0;
    if (applicantsToDelete.length > 0) {
      const applicantDeleteRes = await Applicant.deleteMany({
        _id: { $in: applicantsToDelete },
      });
      deletedApplicantsCount = applicantDeleteRes.deletedCount || 0;
    }

    // 4. Delete the import log itself
    await ImportLog.deleteOne({ _id: id });

    return NextResponse.json({
      success: true,
      deletedApplications: appDeleteRes.deletedCount,
      deletedApplicants: deletedApplicantsCount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to rollback import" }, { status: 500 });
  }
}
