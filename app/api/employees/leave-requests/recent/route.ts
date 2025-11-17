// app/api/employee/leave-requests/recent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const daysWindow = 3;
  const since = new Date();
  since.setDate(since.getDate() - daysWindow);

  const latest = await db.leave.findFirst({
    where: {
      companyId: user.companyId,
      empId: user.id,
      status: {
        in: ["APPROVED", "REJECTED"],
      },
      updatedAt: {
        gte: since,
      },
    },
    include: {
      leaveType: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(latest ?? null);
}
