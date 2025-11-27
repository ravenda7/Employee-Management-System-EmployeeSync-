// app/api/employee/payrolls/route.ts
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
  const companyId = user.companyId || null;

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();

  // default: last 6 months
  const defaultTo = now;
  const defaultFrom = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1
  );

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { message: "Invalid from/to query" },
      { status: 400 }
    );
  }

  // ensure 'to' is inclusive end-of-day
  const toInclusive = new Date(to);
  toInclusive.setHours(23, 59, 59, 999);

  // We limit to payrolls belonging to this employee
  // And, if the user has companyId, also match it (multi-tenant safety)
  const where: any = {
    empId,
    startDate: { gte: from },
    endDate: { lte: toInclusive },
  };

  if (companyId) {
    where.companyId = companyId;
  }

  const payrolls = await db.payroll.findMany({
    where,
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(payrolls);
}
