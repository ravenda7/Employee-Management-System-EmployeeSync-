// app/api/company/[companyId]/employees/[empId]/performance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import {
  calculatePerformanceScore,
  AttendanceForPerf,
  LeaveForPerf,
} from "@/lib/algorithms/performance";
import { predictNextMonthLeaves } from "@/lib/algorithms/leave-prediction";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: { companyId: string; empid: string };
  }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId;
  const empId = params.empid;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdminOrHr =
    (user.role === "COMPANY_ADMIN" || user.role === "COMPANY_HR") &&
    user.companyId === companyId;

  if (!isSuperAdmin && !isCompanyAdminOrHr) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const start = fromParam ? new Date(fromParam) : defaultStart;
  const end = toParam ? new Date(toParam) : defaultEnd;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json(
      { message: "Invalid from/to query" },
      { status: 400 }
    );
  }

  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  // 1) Load employee basic info
  const employee = await db.employee.findFirst({
    where: { id: empId, companyId },
    select: {
      id: true,
      name: true,
      email: true,
      department: {
        select: {
          name: true,
        },
      },
      shift: {
        select: {
          name: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json(
      { message: "Employee not found in this company" },
      { status: 404 }
    );
  }

  // 2) Attendance in period
  const attendances = await db.attendance.findMany({
    where: {
      companyId,
      empId,
      timestamp: {
        gte: start,
        lte: endInclusive,
      },
    },
    orderBy: { timestamp: "asc" },
    select: {
      timestamp: true,
      type: true, // CHECK_IN / CHECK_OUT
      checkInDelayMinutes: true,
    },
  });

  // Group by date for presence / punctuality
  const dayMap: Record<
    string,
    {
      dateKey: string;
      present: boolean;
      anyOnTimeCheckIn: boolean;
    }
  > = {};

  for (const a of attendances) {
    const d = new Date(a.timestamp);
    const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD

    if (!dayMap[dateKey]) {
      dayMap[dateKey] = {
        dateKey,
        present: false,
        anyOnTimeCheckIn: false,
      };
    }

    if (a.type === "CHECK_IN") {
      dayMap[dateKey].present = true;

      const delay = a.checkInDelayMinutes ?? 0;
      if (delay <= 15) {
        dayMap[dateKey].anyOnTimeCheckIn = true;
      }
    }
  }

  const attendanceDays: AttendanceForPerf[] = Object.values(dayMap).map(
    (d) => ({
      dateKey: d.dateKey,
      isPresent: d.present,
      isOnTime: d.anyOnTimeCheckIn,
    })
  );

  // 3) Leaves in period (only APPROVED)
  const leaves = await db.leave.findMany({
    where: {
      companyId,
      empId,
      status: "APPROVED",
      startDate: { lte: endInclusive },
      endDate: { gte: start }, // overlaps with period
    },
    select: {
      duration: true,
    },
  });

  const leaveForPerf: LeaveForPerf[] = leaves.map((l) => ({
    duration: l.duration ?? 0,
  }));

  // 4) Working days in period (Mon–Fri)
  const workingDays = countBusinessDays(start, endInclusive);

  const perfResult = calculatePerformanceScore(
    attendanceDays,
    leaveForPerf,
    workingDays
  );

  // 5) Leave trend for last 3 months (per employee)
  const { leaveTrend, prediction } = await buildLeaveTrendAndPrediction(
    companyId,
    empId,
    now
  );

  return NextResponse.json({
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      departmentName: employee.department?.name ?? null,
      shiftName: employee.shift?.name ?? null,
    },
    period: {
      start,
      end: endInclusive,
      workingDays,
    },
    performance: {
      score: perfResult.score, // 0–1
      attendanceRatio: perfResult.attendanceRatio,
      punctualityRatio: perfResult.punctualityRatio,
      leaveRatio: perfResult.leaveRatio,
    },
    attendanceSummary: {
      presentDays: attendanceDays.filter((d) => d.isPresent).length,
      onTimeDays: attendanceDays.filter((d) => d.isOnTime).length,
      totalDaysWithCheckIn: attendanceDays.length,
    },
    leaveSummary: {
      totalLeaveDays: leaveForPerf.reduce(
        (sum, l) => sum + (l.duration || 0),
        0
      ),
    },
    leaveTrend,
    nextMonthPrediction: prediction,
  });
}

function countBusinessDays(start: Date, end: Date): number {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  let count = 0;
  for (
    let d = new Date(s.getTime());
    d.getTime() <= e.getTime();
    d.setDate(d.getDate() + 1)
  ) {
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return count;
}

async function buildLeaveTrendAndPrediction(
  companyId: string,
  empId: string,
  baseDate: Date
): Promise<{
  leaveTrend: { monthLabel: string; days: number }[];
  prediction: {
    monthLabel: string;
    predictedDays: number;
    trendIncreasing: boolean;
  };
}> {
  // last 3 full months: m-3, m-2, m-1
  const months: { year: number; month: number }[] = [];
  for (let i = 3; i >= 1; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() }); // 0-based month
  }

  const leaveTrend: { monthLabel: string; days: number }[] = [];

  for (const m of months) {
    const monthStart = new Date(m.year, m.month, 1);
    const monthEnd = new Date(m.year, m.month + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthLeaves = await db.leave.findMany({
      where: {
        companyId,
        empId,
        status: "APPROVED",
        startDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        duration: true,
      },
    });

    const totalDays = monthLeaves.reduce(
      (sum, l) => sum + (l.duration || 0),
      0
    );

    const monthLabel = monthStart.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

    leaveTrend.push({
      monthLabel,
      days: totalDays,
    });
  }

  const pastThree = leaveTrend.map((m) => m.days);
  const predResult = predictNextMonthLeaves(pastThree);

  const nextMonthDate = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth() + 1,
    1
  );
  const nextMonthLabel = nextMonthDate.toLocaleString("default", {
    month: "short",
    year: "numeric",
  });

  return {
    leaveTrend,
    prediction: {
      monthLabel: nextMonthLabel,
      predictedDays: Number(predResult.predicted.toFixed(1)),
      trendIncreasing: predResult.trendIncreasing,
    },
  };
}
