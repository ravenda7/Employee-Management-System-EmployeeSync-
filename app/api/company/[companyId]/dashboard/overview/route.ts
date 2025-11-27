// app/api/company/[companyId]/dashboard/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdminOrHr =
    (user.role === "COMPANY_ADMIN" || user.role === "COMPANY_HR") &&
    user.companyId === companyId;

  if (!isSuperAdmin && !isCompanyAdminOrHr) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // --- Date helpers ---
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const endOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const sevenDaysAgo = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 6,
    0,
    0,
    0,
    0
  );

  // --- Basic counts in parallel ---
  const [
    totalEmployees,
    activeEmployees,
    pendingLeaves,
    suspiciousRecent,
    unpaidPayrolls,
    todayCheckIns,
    todayLateCheckIns,
    todayApprovedLeaves,
  ] = await Promise.all([
    db.employee.count({
      where: { companyId },
    }),
    db.employee.count({
      where: { companyId, isActive: true },
    }),
    db.leave.count({
      where: { companyId, status: "PENDING" },
    }),
    db.attendance.count({
      where: {
        companyId,
        isSuspicious: true,
        timestamp: {
          gte: sevenDaysAgo,
          lte: now,
        },
      },
    }),
    db.payroll.count({
      where: { companyId, isPaid: false },
    }),
    db.attendance.count({
      where: {
        companyId,
        type: "CHECK_IN",
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    db.attendance.count({
      where: {
        companyId,
        type: "CHECK_IN",
        checkInDelayMinutes: {
          gt: 5, // >5 minutes late
        },
        timestamp: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    db.leave.count({
      where: {
        companyId,
        status: "APPROVED",
        startDate: {
          lte: endOfToday,
        },
        endDate: {
          gte: startOfToday,
        },
      },
    }),
  ]);

  // --- Attendance trend: last 7 days (including today) ---
  const attendanceTrend: { dateLabel: string; checkIns: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - i,
      0,
      0,
      0,
      0
    );
    const dayStart = d;
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const count = await db.attendance.count({
      where: {
        companyId,
        type: "CHECK_IN",
        timestamp: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
    });

    attendanceTrend.push({
      dateLabel: label,
      checkIns: count,
    });
  }

  return NextResponse.json({
    stats: {
      totalEmployees,
      activeEmployees,
      pendingLeaves,
      suspiciousRecent,
      unpaidPayrolls,
    },
    today: {
      checkIns: todayCheckIns,
      lateCheckIns: todayLateCheckIns,
      approvedLeaves: todayApprovedLeaves,
      date: startOfToday,
    },
    attendanceTrend,
  });
}
