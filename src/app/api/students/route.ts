import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student, { STUDENT_STATUSES } from "@/models/Student";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const follower = searchParams.get("follower")?.trim() || "";
    const course = searchParams.get("course")?.trim() || "";

    // Build filter query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (follower && follower !== "all") {
      query.follower = follower;
    }

    if (course && course !== "all") {
      query.courseName = course;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { name: searchRegex },
        { tpNumber: searchRegex },
        { courseName: searchRegex },
        { follower: searchRegex },
        { notes: searchRegex },
      ];
    }

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Summary counters
    const allStudents = await Student.find({}, "status courseName follower").lean();
    const total = allStudents.length;

    const stats: Record<string, number> = {
      all: total,
      New: 0,
      Contacted: 0,
      "No Answer": 0,
      "Follow Up": 0,
    };

    allStudents.forEach((s) => {
      if (stats[s.status] !== undefined) {
        stats[s.status]++;
      }
    });

    // Unique courses and followers for filter dropdowns
    const uniqueCourses = Array.from(new Set(allStudents.map((s) => s.courseName).filter(Boolean)));
    const uniqueFollowers = Array.from(new Set(allStudents.map((s) => s.follower).filter(Boolean)));

    return NextResponse.json({
      success: true,
      students,
      stats,
      courses: uniqueCourses,
      followers: uniqueFollowers,
    });
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, tpNumber, courseName, status, follower, email, notes, source } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "Student name is required" },
        { status: 400 }
      );
    }

    if (!tpNumber?.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact / TP number is required" },
        { status: 400 }
      );
    }

    if (!courseName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Course name is required" },
        { status: 400 }
      );
    }

    // Clean / normalize TP number (keep numbers and +)
    const cleanedTp = tpNumber.trim();

    const newStudent = await Student.create({
      name: name.trim(),
      tpNumber: cleanedTp,
      courseName: courseName.trim(),
      status: STUDENT_STATUSES.includes(status) ? status : "New",
      follower: follower?.trim() || "None",
      email: email?.trim() || "",
      notes: notes?.trim() || "",
      source: source?.trim() || "Facebook Ad",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Student registered successfully",
        student: newStudent,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit student details" },
      { status: 500 }
    );
  }
}

