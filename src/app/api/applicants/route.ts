import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Application from "@/models/Application";
import Applicant from "@/models/Applicant";
import { normalizePhone } from "@/lib/normalizePhone";
import Position from "@/models/Position";
import "@/models/Batch";
import mongoose from "mongoose";
import { generateNextInternId } from "@/lib/internId";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search") || "";
    const language = searchParams.get("language") || "";
    const follower = searchParams.get("follower") || "";
    const education = searchParams.get("education") || "";
    const positionId = searchParams.get("positionId") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const date = searchParams.get("date") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build application-level match stage
    const appMatch: Record<string, unknown> = {};
    if (positionId) appMatch.positionId = new mongoose.Types.ObjectId(positionId);
    if (status) {
      appMatch.status = status;
    }
    if (date) {
      if (status === "Interview") {
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
      if (status === "Interview") {
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

    // Build applicant-level match stage (applied after $lookup)
    const applicantMatch: Record<string, unknown> = {};
    const conditions: any[] = [];

    if (search) {
      conditions.push({
        $or: [
          { "applicant.fullName": { $regex: search, $options: "i" } },
          { "applicant.email": { $regex: search, $options: "i" } },
          { "applicant.phone": { $regex: search, $options: "i" } },
        ]
      });
    }
    if (language) conditions.push({ "applicant.preferredLanguage": language });
    if (follower) conditions.push({ "applicant.follower": follower });
    if (education) conditions.push({ "applicant.educationLevel": education });

    if (conditions.length > 0) {
      applicantMatch.$and = conditions;
    }

    // Single aggregation pipeline — replaces the two-step find approach
    const pipeline: mongoose.PipelineStage[] = [
      { $match: appMatch },
      // Join applicant
      {
        $lookup: {
          from: "applicants",
          localField: "applicantId",
          foreignField: "_id",
          as: "applicantArr",
        },
      },
      { $unwind: "$applicantArr" },
      // Rename to match the populate() shape the frontend expects
      { $addFields: { applicant: "$applicantArr" } },
      { $unset: "applicantArr" },
    ];

    // Apply applicant-level filters
    if (Object.keys(applicantMatch).length > 0) {
      pipeline.push({ $match: applicantMatch });
    }

    // Sort before pagination
    if (status === "Interview") {
      pipeline.push({
        $addFields: {
          hasInterviewDate: {
            $cond: {
              if: { $ne: [{ $ifNull: ["$interviewDate", null] }, null] },
              then: 1,
              else: 0
            }
          }
        }
      });
      pipeline.push({
        $sort: {
          hasInterviewDate: -1, // Candidates with scheduled date first
          interviewDate: 1,     // Earliest interviews first
          appliedDate: 1,       // Fallback sorting chronologically (first come first served)
          createdAt: 1
        }
      });
    } else {
      pipeline.push({ $sort: { appliedDate: 1, createdAt: 1 } });
    }

    // Use $facet to get paginated data + total count in ONE query
    pipeline.push({
      $facet: {
        applications: [
          { $skip: skip },
          { $limit: limit },
          // Join position and batch
          {
            $lookup: {
              from: "positions",
              localField: "positionId",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, department: 1 } }],
              as: "positionArr",
            },
          },
          { $unwind: { path: "$positionArr", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "batches",
              localField: "batchId",
              foreignField: "_id",
              pipeline: [{ $project: { title: 1 } }],
              as: "batchArr",
            },
          },
          { $unwind: { path: "$batchArr", preserveNullAndEmptyArrays: true } },
          // Reshape to match the populate() output shape
          {
            $addFields: {
              applicantId: "$applicant",
              positionId: "$positionArr",
              batchId: "$batchArr",
            },
          },
          { $unset: ["applicant", "positionArr", "batchArr"] },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    const [result] = await Application.aggregate(pipeline);
    const applications = result.applications || [];
    const total = result.totalCount[0]?.count || 0;

    // Calculate counts for tabs
    const allAppsForCounts = await Application.aggregate([
      { $match: positionId ? { positionId: new mongoose.Types.ObjectId(positionId) } : {} },
      {
        $lookup: {
          from: "applicants",
          localField: "applicantId",
          foreignField: "_id",
          as: "applicant",
        },
      },
      { $unwind: "$applicant" },
      {
        $project: {
          status: 1,
        }
      }
    ]);

    const counts = {
      all: 0,
      new: 0,
      messaged: 0,
      noresponse: 0,
      interview: 0,
      confirmed: 0,
      followup: 0,
      rejected: 0,
    };

    for (const app of allAppsForCounts) {
      const status = app.status;

      if (status === "New") counts.new++;
      else if (status === "Messaged") counts.messaged++;
      else if (status === "No Response") counts.noresponse++;
      else if (status === "Interview") counts.interview++;
      else if (status === "Confirmed") counts.confirmed++;
      else if (status === "Follow Up") counts.followup++;
      else if (status === "Rejected") counts.rejected++;

      counts.all++;
    }

    return NextResponse.json({ applications, total, page, limit, counts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      fullName, email, phone, group,
      linkedin, portfolio, educationLevel,
      preferredLanguage, follower, cvUrl,
      positionId, batchId, country, county,
    } = body;

    if (!fullName || !email || !phone || !positionId || !batchId) {
      return NextResponse.json(
        { error: "Full name, email, phone, position and batch are required" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    const cleanPhone = phone.replace(/\D/g, "");
    const last7 = cleanPhone.slice(-7);

    // Check for duplicate by email, exact normalized phone, or last 7 digits regex matching
    const existing = await Applicant.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: normalizedPhone },
        { phone: { $regex: last7 + "$" } }
      ],
    });

    if (existing) {
      const hasAnyApp = await Application.findOne({ applicantId: existing._id });
      if (hasAnyApp) {
        return NextResponse.json(
          { error: "This candidate has already submitted an application. Multiple applications are not allowed." },
          { status: 409 }
        );
      }
    }

    let applicant;
    if (existing) {
      applicant = existing;
    } else {
      const applicantCountry = country || county || "Sri Lanka";
      
      // Fetch position name to generate prefix-based sequential ID
      const positionObj = await Position.findById(positionId);
      const positionName = positionObj ? positionObj.name : "Software Engineer Intern";
      const internId = await generateNextInternId(positionName);

      applicant = await Applicant.create({
        fullName,
        email: email.toLowerCase(),
        phone: normalizedPhone,
        group,
        linkedin,
        portfolio,
        educationLevel,
        preferredLanguage,
        follower: follower || "None",
        cvUrl,
        country: applicantCountry,
        internId,
      });
    }

    const application = await Application.create({
      applicantId: applicant._id,
      positionId,
      batchId,
      status: "New",
      appliedDate: new Date(),
      internId: applicant.internId,
    });

    return NextResponse.json({ applicant, application }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create applicant" }, { status: 500 });
  }
}
