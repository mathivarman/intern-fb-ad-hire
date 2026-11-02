import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Application from "@/models/Application";
import Applicant from "@/models/Applicant";
import mongoose from "mongoose";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { applicationIds, selectAllMatching, filters, status, notes, interviewDate } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updateFields: Record<string, any> = { status };
    if (notes !== undefined) updateFields.notes = notes;
    if (interviewDate !== undefined) updateFields.interviewDate = interviewDate;

    let targetIds: mongoose.Types.ObjectId[] = [];

    if (selectAllMatching && filters) {
      const {
        search = "",
        language = "",
        follower = "",
        education = "",
        positionId = "",
        status: filterStatus = "",
        date = "",
        dateFrom = "",
        dateTo = "",
      } = filters;

      const appMatch: Record<string, unknown> = {};
      if (positionId && positionId !== "all") {
        appMatch.positionId = new mongoose.Types.ObjectId(positionId);
      }
      if (filterStatus && filterStatus !== "all") {
        appMatch.status = filterStatus;
      }
      if (date) {
        if (filterStatus === "Interview") {
          const start = new Date(date);
          const end = new Date(date);
          end.setUTCHours(23, 59, 59, 999);
          appMatch.interviewDate = { $gte: start, $lte: end };
        } else {
          const start = new Date(date);
          const end = new Date(date);
          end.setUTCHours(23, 59, 59, 999);
          appMatch.appliedDate = { $gte: start, $lte: end };
        }
      } else if (dateFrom || dateTo) {
        if (filterStatus === "Interview") {
          appMatch.interviewDate = {} as Record<string, Date>;
          if (dateFrom) (appMatch.interviewDate as Record<string, Date>).$gte = new Date(dateFrom);
          if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setUTCHours(23, 59, 59, 999);
            (appMatch.interviewDate as Record<string, Date>).$lte = endOfDay;
          }
        } else {
          appMatch.appliedDate = {} as Record<string, Date>;
          if (dateFrom) (appMatch.appliedDate as Record<string, Date>).$gte = new Date(dateFrom);
          if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setUTCHours(23, 59, 59, 999);
            (appMatch.appliedDate as Record<string, Date>).$lte = endOfDay;
          }
        }
      }

      const conditions: any[] = [];
      if (search) {
        conditions.push({
          $or: [
            { "applicant.fullName": { $regex: search, $options: "i" } },
            { "applicant.email": { $regex: search, $options: "i" } },
            { "applicant.phone": { $regex: search, $options: "i" } },
          ],
        });
      }
      if (language && language !== "all") conditions.push({ "applicant.preferredLanguage": language });
      if (follower && follower !== "all") conditions.push({ "applicant.follower": follower });
      if (education && education !== "all") conditions.push({ "applicant.educationLevel": education });

      const pipeline: mongoose.PipelineStage[] = [
        { $match: appMatch },
        {
          $lookup: {
            from: "applicants",
            localField: "applicantId",
            foreignField: "_id",
            as: "applicant",
          },
        },
        { $unwind: "$applicant" },
      ];

      if (conditions.length > 0) {
        pipeline.push({ $match: { $and: conditions } });
      }

      pipeline.push({ $project: { _id: 1 } });

      const matched = await Application.aggregate(pipeline);
      targetIds = matched.map((m: any) => m._id);
    } else if (Array.isArray(applicationIds) && applicationIds.length > 0) {
      targetIds = applicationIds.map((id: string) => new mongoose.Types.ObjectId(id));
    } else {
      return NextResponse.json({ error: "No applications selected" }, { status: 400 });
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ success: true, modifiedCount: 0 });
    }

    const result = await Application.updateMany(
      { _id: { $in: targetIds } },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error bulk updating applications:", err);
    return NextResponse.json({ error: "Failed to update applications" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
