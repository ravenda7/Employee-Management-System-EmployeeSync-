import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
  const sameCompany = user.companyId === companyId;

  if (!isSuperAdmin && !sameCompany) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD
  const employeeId = searchParams.get("employeeId");
  const onlySuspicious = searchParams.get("suspicious") === "true";

  const where: any = {
    companyId,
  };

  if (employeeId) {
    where.empId = employeeId;
  }

  if (onlySuspicious) {
    where.isSuspicious = true;
  }

  // Filter by a single calendar day if date provided
  if (dateParam) {
    const start = new Date(`${dateParam}T00:00:00.000Z`);
    const end = new Date(`${dateParam}T23:59:59.999Z`);
    where.timestamp = {
      gte: start,
      lte: end,
    };
  }

  const records = await db.attendance.findMany({
    where,
    orderBy: {
      timestamp: "desc",
    },
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: {
            select: { name: true },
          },
        },
      },
      shift: {
        select: {
          id: true,
          name: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  return NextResponse.json(records);
}
