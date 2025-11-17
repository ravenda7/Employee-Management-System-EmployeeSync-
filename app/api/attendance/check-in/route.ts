// app/api/attendance/check-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { validateAttendance, ipToInt, IpRange } from "@/lib/algorithms/attendance";
import { buildDateWithTime, diffMinutes } from "@/lib/time";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getClientIp } from "@/lib/external/ip";


export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.companyId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { deviceId } = await req.json();
  if (!deviceId) {
    return NextResponse.json(
      { message: "deviceId is required" },
      { status: 400 }
    );
  }

  const clientIp = getClientIp(req);
  const companyId = user.companyId;

  // Get employee inside this company, plus shift
  const employee = await db.employee.findFirst({
    where: {
      id: user.id,
      companyId,
    },
    include: {
      shift: true,
    },
  });

  if (!employee) {
    return new NextResponse("Employee not found", { status: 404 });
  }

  // Get company + whitelisted ranges using companyId from session
  const company = await db.company.findUnique({
    where: { id: companyId },
    include: {
      whitelistedIpRanges: true,
    },
  });

  if (!company) {
    return new NextResponse("Company not found", { status: 404 });
  }

  const whitelistedIpRangesPrisma = company.whitelistedIpRanges ?? [];
  const whitelistedIpRanges: IpRange[] = whitelistedIpRangesPrisma.map((r) => ({
    minInt: ipToInt(r.minIpRange),
    maxInt: ipToInt(r.maxIpRange),
  }));

  const result = validateAttendance({
    ip: clientIp,
    deviceId,
    approvedDeviceIds: employee.approvedDeviceIds ?? [],
    unverifiedDeviceIds: employee.unverifiedDeviceIds ?? [],
    whitelistedIpRanges,
  });

  if (result.shouldAddToUnverified) {
    await db.employee.update({
      where: { id: employee.id },
      data: {
        unverifiedDeviceIds: {
          push: deviceId,
        },
      },
    });
  }

  const now = new Date();

  // Shift-based lateness
  let scheduledStartTime: Date | null = null;
  let checkInDelayMinutes: number | null = null;

  if (employee.shift?.startTime) {
    scheduledStartTime = buildDateWithTime(employee.shift.startTime, now);
    const diff = diffMinutes(now, scheduledStartTime); // positive = late
    checkInDelayMinutes = diff > 0 ? diff : 0;
  }

  await db.attendance.create({
    data: {
      companyId,
      empId: employee.id,
      type: "CHECK_IN",
      timestamp: now,
      loggedIp: clientIp,
      deviceId,
      verificationStatus: result.status,
      isSuspicious: result.suspicious,
      shiftId: employee.shiftId ?? null,
      scheduledStartTime,
      checkInDelayMinutes,
    },
  });

  return NextResponse.json({
    status: result.status,
    suspicious: result.suspicious,
    checkInDelayMinutes,
  });
}
