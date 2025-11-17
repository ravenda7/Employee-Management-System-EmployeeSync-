// app/api/employee/leave-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

function getYearRange(date: Date) {
  const year = date.getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const leaves = await db.leave.findMany({
    where: {
      companyId: user.companyId,
      empId: user.id,
    },
    include: {
      leaveType: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(leaves);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { leaveTypeId, startDate, endDate, reason } = body as {
    leaveTypeId?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  };

  if (!leaveTypeId || !startDate || !endDate) {
    return NextResponse.json(
      { message: "leaveTypeId, startDate and endDate are required" },
      { status: 400 }
    );
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json(
      { message: "Invalid startDate or endDate" },
      { status: 400 }
    );
  }

  if (end < start) {
    return NextResponse.json(
      { message: "End date cannot be before start date" },
      { status: 400 }
    );
  }

  // duration in days (inclusive)
  const msPerDay = 1000 * 60 * 60 * 24;
  const rawDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  const duration = rawDays;

  const leaveType = await db.leaveType.findFirst({
    where: {
      id: leaveTypeId,
      companyId: user.companyId,
    },
  });

  if (!leaveType) {
    return NextResponse.json(
      { message: "Leave type not found" },
      { status: 404 }
    );
  }

  // Enforce yearly limit if set
  if (leaveType.yearlyLimit != null) {
    const { start: yearStart, end: yearEnd } = getYearRange(start);

    const aggregate = await db.leave.aggregate({
      where: {
        companyId: user.companyId,
        empId: user.id,
        leaveTypeId: leaveType.id,
        status: {
          in: ["APPROVED", "PENDING"], // count both to avoid overbooking
        },
        startDate: {
          gte: yearStart,
          lt: yearEnd,
        },
      },
      _sum: {
        duration: true,
      },
    });

    const used = aggregate._sum.duration ?? 0;
    const willBeUsed = used + duration;

    if (willBeUsed > leaveType.yearlyLimit) {
      return NextResponse.json(
        {
          message: `Leave limit exceeded for ${leaveType.name}. Yearly limit: ${leaveType.yearlyLimit}, already used/pending: ${used}, this request: ${duration}.`,
        },
        { status: 400 }
      );
    }
  }

  const created = await db.leave.create({
    data: {
      companyId: user.companyId,
      empId: user.id,
      leaveTypeId: leaveType.id,
      startDate: start,
      endDate: end,
      duration,
      status: leaveType.requiresApproval ? "PENDING" : "APPROVED",
      isPaid: leaveType.isPaid,
      reason: reason ?? null,
    },
    include: {
      leaveType: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
