import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const sixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
    0,
    0,
    0,
    0
  );

  const [totalTenants, activeTenants, totalEmployees, totalAttendance] =
    await Promise.all([
      db.company.count(),
      db.company.count({ where: { isActive: true } }),
      db.employee.count(),
      db.attendance.count(),
    ]);

  const [pendingLeaves, approvedLeaves, rejectedLeaves] = await Promise.all([
    db.leave.count({ where: { status: "PENDING" } }),
    db.leave.count({ where: { status: "APPROVED" } }),
    db.leave.count({ where: { status: "REJECTED" } }),
  ]);

  // top 5 tenants by employee count
  const companiesWithCounts = await db.company.findMany({
    include: {
      _count: {
        select: {
          employees: true,
        },
      },
    },
  });

  const topTenants = companiesWithCounts
    .map((c) => ({
      id: c.id,
      name: c.name,
      isActive: c.isActive,
      employeesCount: c._count.employees,
    }))
    .sort((a, b) => b.employeesCount - a.employeesCount)
    .slice(0, 5);

  // new tenants last 6 months (for a simple trend)
  const recentCompanies = companiesWithCounts.filter(
    (c) => c.createdAt >= sixMonthsAgo
  );

  const monthBuckets = new Map<
    string,
    { label: string; count: number }
  >();

  // Initialize 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const label = d.toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
    monthBuckets.set(key, { label, count: 0 });
  }

  for (const c of recentCompanies) {
    const d = c.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const bucket = monthBuckets.get(key);
    if (bucket) bucket.count += 1;
  }

  const tenantTrend = Array.from(monthBuckets.values());

  return NextResponse.json({
    totals: {
      totalTenants,
      activeTenants,
      totalEmployees,
      totalAttendance,
      leaves: {
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves,
      },
    },
    topTenants,
    tenantTrend,
  });
}
