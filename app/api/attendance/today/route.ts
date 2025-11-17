// app/api/attendance/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

type LatenessStatus = "ON_TIME" | "LATE" | "VERY_LATE";
type EarlyLeaveStatus = "ON_TIME" | "LEFT_EARLY" | "LEFT_VERY_EARLY";

function getLatenessStatus(delayMinutes: number | null): LatenessStatus | null {
  if (delayMinutes == null) return null;
  if (delayMinutes <= 5) return "ON_TIME";
  if (delayMinutes <= 30) return "LATE";
  return "VERY_LATE";
}

function getEarlyLeaveStatus(
  earlyMinutes: number | null
): EarlyLeaveStatus | null {
  if (earlyMinutes == null) return null;
  if (earlyMinutes === 0) return "ON_TIME";
  if (earlyMinutes <= 30) return "LEFT_EARLY";
  return "LEFT_VERY_EARLY";
}

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const attendances = await db.attendance.findMany({
    where: {
      empId: userId,
      timestamp: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { timestamp: "asc" },
  });

  const checkIn = attendances.find((a) => a.type === "CHECK_IN") ?? null;
  const checkOut =
    [...attendances].reverse().find((a) => a.type === "CHECK_OUT") ?? null;

  const delay = checkIn?.checkInDelayMinutes ?? null;
  const latenessStatus = getLatenessStatus(delay);

  const early = checkOut?.earlyCheckoutMinutes ?? null;
  const earlyLeaveStatus = getEarlyLeaveStatus(early);

  return NextResponse.json({
    checkedInAt: checkIn?.timestamp ?? null,
    checkedOutAt: checkOut?.timestamp ?? null,
    status: checkIn?.verificationStatus ?? null,
    suspicious: checkIn?.isSuspicious ?? false,

    checkInDelayMinutes: delay,
    latenessStatus,
    earlyCheckoutMinutes: early,
    earlyLeaveStatus,
  });
}
