// app/api/attendance/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  const fromParam = searchParams.get("from"); // YYYY-MM-DD
  const toParam = searchParams.get("to");     // YYYY-MM-DD

  // Default: last 30 days
  const now = new Date();
  const defaultTo = new Date(now);
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const from = fromParam
    ? new Date(`${fromParam}T00:00:00.000Z`)
    : defaultFrom;
  const to = toParam
    ? new Date(`${toParam}T23:59:59.999Z`)
    : defaultTo;

  const records = await db.attendance.findMany({
    where: {
      companyId: user.companyId,
      empId: user.id,
      timestamp: {
        gte: from,
        lte: to,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    select: {
      id: true,
      timestamp: true,
      type: true, // CHECK_IN | CHECK_OUT
      // we DO NOT include verificationStatus / isSuspicious etc
      shift: {
        select: {
          name: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  return NextResponse.json(records);
}
