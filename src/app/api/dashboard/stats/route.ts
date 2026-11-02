import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Applicant from "@/models/Applicant";
import Application from "@/models/Application";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run application and applicant aggregations in parallel
    const [appResult, applicantResult] = await Promise.all([
      // Single $facet aggregation replaces 7 separate countDocuments + 4 aggregates
      Application.aggregate([
        {
          $facet: {
            totalApplications: [{ $count: "count" }],
            todayApplications: [
              { $match: { appliedDate: { $gte: startOfDay } } },
              { $count: "count" },
            ],
            monthApplications: [
              { $match: { appliedDate: { $gte: startOfMonth } } },
              { $count: "count" },
            ],
            selectedCount: [
              { $match: { status: "Follow Up" } },
              { $count: "count" },
            ],
            rejectedCount: [
              { $match: { status: "Rejected" } },
              { $count: "count" },
            ],
            interviewedCount: [
              { $match: { status: "Interview" } },
              { $count: "count" },
            ],
            byStatus: [
              { $group: { _id: "$status", count: { $sum: 1 } } },
            ],
            byPosition: [
              {
                $lookup: {
                  from: "positions",
                  localField: "positionId",
                  foreignField: "_id",
                  as: "position",
                },
              },
              { $unwind: "$position" },
              { $group: { _id: "$position.name", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            byMonth: [
              {
                $group: {
                  _id: {
                    year: { $year: "$appliedDate" },
                    month: { $month: "$appliedDate" },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { "_id.year": 1, "_id.month": 1 } },
              { $limit: 12 },
            ],
          },
        },
      ]),
      // Single $facet for all applicant stats
      Applicant.aggregate([
        {
          $facet: {
            totalApplicants: [{ $count: "count" }],
            tamilCount: [
              { $match: { preferredLanguage: "Tamil" } },
              { $count: "count" },
            ],
            sinhalaCount: [
              { $match: { preferredLanguage: "Sinhala" } },
              { $count: "count" },
            ],
            englishCount: [
              { $match: { preferredLanguage: "English" } },
              { $count: "count" },
            ],
            byLanguage: [
              { $group: { _id: "$preferredLanguage", count: { $sum: 1 } } },
            ],
            byEducation: [
              { $group: { _id: "$educationLevel", count: { $sum: 1 } } },
            ],
          },
        },
      ]),
    ]);

    // Helper to extract count from facet result
    const c = (arr: { count: number }[]) => arr[0]?.count || 0;

    const app = appResult[0];
    const apt = applicantResult[0];

    const totalApplications = c(app.totalApplications);
    const selectedCount = c(app.selectedCount);
    const interviewedCount = c(app.interviewedCount);

    const conversionRate = totalApplications > 0
      ? Math.round((selectedCount / totalApplications) * 100)
      : 0;
    const interviewRate = totalApplications > 0
      ? Math.round((interviewedCount / totalApplications) * 100)
      : 0;

    return NextResponse.json({
      kpis: {
        totalApplications,
        totalApplicants: c(apt.totalApplicants),
        todayApplications: c(app.todayApplications),
        monthApplications: c(app.monthApplications),
        selectedCount,
        rejectedCount: c(app.rejectedCount),
        interviewedCount,
        tamilCount: c(apt.tamilCount),
        sinhalaCount: c(apt.sinhalaCount),
        englishCount: c(apt.englishCount),
        conversionRate,
        interviewRate,
      },
      charts: {
        byStatus: app.byStatus,
        byPosition: app.byPosition,
        byLanguage: apt.byLanguage,
        byEducation: apt.byEducation,
        byMonth: app.byMonth,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
