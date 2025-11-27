// app/api/superadmin/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companies = await db.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          employees: true,
          whitelistedIpRanges: true,
          departments: true,
        },
      },
    },
  });

  const rows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    adminEmail: c.adminEmail,
    createdAt: c.createdAt.toISOString(),
    isActive: (c as any).isActive ?? true,
    deactivatedAt: (c as any).deactivatedAt
      ? (c as any).deactivatedAt.toISOString()
      : null,
    employeesCount: c._count.employees,
    ipRangeCount: c._count.whitelistedIpRanges,
    departmentCount: c._count.departments,
  }));

  return NextResponse.json(rows);
}
