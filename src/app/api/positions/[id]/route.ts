import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Position from "@/models/Position";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const position = await Position.findByIdAndUpdate(id, body, { new: true });
    if (!position) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ position });
  } catch {
    return NextResponse.json({ error: "Failed to update position" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();
    const position = await Position.findByIdAndUpdate(id, { status }, { new: true });
    if (!position) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ position });
  } catch {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    await Position.findByIdAndDelete(id);
    return NextResponse.json({ message: "Deleted" });
  } catch {
    return NextResponse.json({ error: "Failed to delete position" }, { status: 500 });
  }
}
