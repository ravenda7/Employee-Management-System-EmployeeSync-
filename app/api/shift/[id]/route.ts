// app/api/shift/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTimeStringToDate } from "@/lib/time";

interface ShiftContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/shift/[id]
export async function PATCH(req: NextRequest, context: ShiftContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { name, startTime, endTime } = body as {
      name?: string;
      startTime?: string;
      endTime?: string;
    };

    if (!id) {
      return NextResponse.json(
        { message: "Shift id is required" },
        { status: 400 }
      );
    }

    const existing = await db.shift.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { message: "Shift not found" },
        { status: 404 }
      );
    }

    // Build update data
    const data: any = {};

    if (name !== undefined) {
      data.name = name;
    }

    let newStart: Date | undefined;
    let newEnd: Date | undefined;

    if (startTime) {
      newStart = parseTimeStringToDate(startTime);
      data.startTime = newStart;
    }

    if (endTime) {
      newEnd = parseTimeStringToDate(endTime);
      data.endTime = newEnd;
    }

    // Validate time ordering if either changed
    if (startTime || endTime) {
      const finalStart = newStart ?? existing.startTime;
      const finalEnd = newEnd ?? existing.endTime;

      if (finalEnd <= finalStart) {
        return NextResponse.json(
          { message: "End time must be after start time" },
          { status: 400 }
        );
      }
    }

    const updated = await db.shift.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      { message: "Failed to update shift" },
      { status: 500 }
    );
  }
}

// DELETE /api/shift/[id]
export async function DELETE(_req: NextRequest, context: ShiftContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { message: "Shift id is required" },
        { status: 400 }
      );
    }

    await db.shift.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      { message: "Failed to delete shift" },
      { status: 500 }
    );
  }
}
