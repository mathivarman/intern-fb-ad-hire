import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Student, { STUDENT_STATUSES } from "@/models/Student";
import mongoose from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const student = await Student.findById(id).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch student" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const allowedFields = ["name", "tpNumber", "courseName", "status", "follower", "notes", "email"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        if (key === "status" && !STUDENT_STATUSES.includes(body[key])) {
          return NextResponse.json(
            { success: false, error: `Invalid status: ${body[key]}` },
            { status: 400 }
          );
        }
        updates[key] = typeof body[key] === "string" ? body[key].trim() : body[key];
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error("PATCH /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update student" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid student ID" },
        { status: 400 }
      );
    }

    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete student" },
      { status: 500 }
    );
  }
}

