import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const schema = z.object({
  timestamp: z.string().datetime().optional(), // ISO string
  verificationStatus: z
    .enum(["IN_OFFICE", "REMOTE", "MANUAL_ADJUSTMENT"])
    .optional(),
  manualNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { timestamp, verificationStatus, manualNote } = parsed.data;

  const attendance = await db.attendance.findUnique({
    where: { id: params.id },
  });

  if (!attendance) {
    return NextResponse.json(
      { message: "Attendance record not found" },
      { status: 404 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const sameCompany = user.companyId === attendance.companyId;

  if (!isSuperAdmin && !sameCompany) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

    const baseDetails =
    typeof attendance.ipCheckDetails === "object" &&
    attendance.ipCheckDetails !== null &&
    !Array.isArray(attendance.ipCheckDetails)
        ? (attendance.ipCheckDetails as Record<string, any>)
        : {};

    const ipDetails = {
    ...baseDetails,
    manualAdjusted: true,
    manualAdjustedBy: user.id,
    manualAdjustedAt: new Date().toISOString(),
    ...(manualNote ? { manualNote } : {}),
    };


  const data: any = {
    ipCheckDetails: ipDetails,
  };

  if (timestamp) {
    data.timestamp = new Date(timestamp);
  }

  if (verificationStatus) {
    data.verificationStatus = verificationStatus;
    if (verificationStatus === "MANUAL_ADJUSTMENT") {
      data.isSuspicious = false;
    }
  }

  const updated = await db.attendance.update({
    where: { id: attendance.id },
    data,
  });

  return NextResponse.json(updated);
}
