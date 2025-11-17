// app/api/company/[companyId]/shifts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseTimeStringToDate } from "@/lib/time";

interface CompanyContext {
  params: Promise<{ companyId: string }>;
}

// GET: list all shifts for this company
export async function GET(_req: NextRequest, context: CompanyContext) {
  const { companyId } = await context.params;

  const shifts = await db.shift.findMany({
    where: { companyId },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(shifts);
}

// POST: create a new shift template
export async function POST(req: NextRequest, context: CompanyContext) {
  try {
    const { companyId } = await context.params;
    const body = await req.json();

    const { name, startTime, endTime } = body as {
      name?: string;
      startTime: string;
      endTime: string;
    };

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { message: "name, startTime, and endTime are required" },
        { status: 400 }
      );
    }

    const start = parseTimeStringToDate(startTime);
    const end = parseTimeStringToDate(endTime);

    if (end <= start) {
      return NextResponse.json(
        { message: "End time must be after start time" },
        { status: 400 }
      );
    }

    const shift = await db.shift.create({
      data: {
        companyId,
        name,
        startTime: start,
        endTime: end,
      },
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { message: "Failed to create shift" },
      { status: 500 }
    );
  }
}
