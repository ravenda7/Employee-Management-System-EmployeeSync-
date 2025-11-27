// app/api/employees/dashboard/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const empId = user.id;
  const companyId = user.companyId;

  if (!companyId) {
    return NextResponse.json(
      { message: "No company attached to this user" },
      { status: 400 }
    );
  }

  const now = new Date();

  // ---- Attendance: last 30 days ----
  const start30 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 29,
    0,
    0,
    0,
    0
  );
  const end30 = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const attendanceRecords = await db.attendance.findMany({
    where: {
      companyId,
      empId,
      timestamp: {
        gte: start30,
        lte: end30,
      },
      type: "CHECK_IN",
    },
    orderBy: { timestamp: "asc" },
    select: {
      timestamp: true,
      checkInDelayMinutes: true,
    },
  });

  // Group attendance by day
  const byDay = new Map<
    string,
    { date: Date; present: boolean; checkInDelayMinutes: number | null }
  >();

  for (const rec of attendanceRecords) {
    const d = rec.timestamp;
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

    const existing = byDay.get(key);
    // if multiple, keep the earliest check-in
    if (!existing || d < existing.date) {
      byDay.set(key, {
        date: d,
        present: true,
        checkInDelayMinutes: rec.checkInDelayMinutes ?? null,
      });
    }
  }

  // Build 30-day trend array
  const attendanceTrend: {
    date: string;
    dateLabel: string;
    present: number; // 0/1
    lateMinutes: number | null;
  }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i,
      0,
      0,
      0,
      0
    );
    const key = d.toISOString().slice(0, 10);

    const info = byDay.get(key);
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });

    attendanceTrend.push({
      date: key,
      dateLabel: label,
      present: info?.present ? 1 : 0,
      lateMinutes: info?.checkInDelayMinutes ?? null,
    });
  }

  // ---- Punctuality summary ----
  let onTime = 0;
  let late = 0;
  let veryLate = 0;

  for (const day of attendanceTrend) {
    if (!day.present) continue;
    const delay = day.lateMinutes ?? 0;
    if (delay <= 5) onTime++;
    else if (delay <= 30) late++;
    else veryLate++;
  }

  const punctuality = {
    onTime,
    late,
    veryLate,
    total: onTime + late + veryLate,
  };

  // ---- Leave usage this year ----
  const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

  const leavesThisYear = await db.leave.findMany({
    where: {
      companyId,
      empId,
      status: "APPROVED",
      startDate: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    select: {
      duration: true,
      leaveType: {
        select: {
          id: true,
          name: true,
          code: true,
          yearlyLimit: true,
        },
      },
    },
  });

  const leaveMap = new Map<
    string,
    {
      leaveTypeId: string;
      name: string;
      code: string;
      usedDays: number;
      yearlyLimit: number | null;
    }
  >();

  for (const l of leavesThisYear) {
    if (!l.leaveType) continue;
    const key = l.leaveType.id;
    const existing = leaveMap.get(key);
    const used = l.duration ?? 0;
    if (!existing) {
      leaveMap.set(key, {
        leaveTypeId: key,
        name: l.leaveType.name,
        code: l.leaveType.code,
        usedDays: used,
        yearlyLimit:
          l.leaveType.yearlyLimit !== null
            ? Number(l.leaveType.yearlyLimit)
            : null,
      });
    } else {
      existing.usedDays += used;
    }
  }

  const leaveSummary = Array.from(leaveMap.values());

  // ---- Upcoming approved leaves ----
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  const upcomingLeaves = await db.leave.findMany({
    where: {
      companyId,
      empId,
      status: "APPROVED",
      endDate: {
        gte: todayMidnight,
      },
    },
    orderBy: {
      startDate: "asc",
    },
    take: 5,
    select: {
      id: true,
      startDate: true,
      endDate: true,
      duration: true,
      status: true,
      leaveType: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  });

  return NextResponse.json({
    attendanceTrend,
    punctuality,
    leaveSummary,
    upcomingLeaves,
  });
}
