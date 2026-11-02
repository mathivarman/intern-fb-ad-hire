import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Position from "@/models/Position";

export async function GET() {
  try {
    await connectDB();
    const positions = await Position.find().sort({ createdAt: -1 });
    return NextResponse.json({ positions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, department, description, status } = body;

    if (!name || !department) {
      return NextResponse.json({ error: "Name and department are required" }, { status: 400 });
    }

    const position = await Position.create({ name, department, description, status: status || "active" });
    return NextResponse.json({ position }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create position" }, { status: 500 });
  }
}
