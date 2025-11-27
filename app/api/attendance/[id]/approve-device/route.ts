import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ipToInt } from "@/lib/external/ip";
import { validateAttendance } from "@/lib/algorithms/attendance";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const attendance = await db.attendance.findUnique({
    where: { id: params.id },
    include: {
      employee: {
        include: {
          company: {
            include: {
              whitelistedIpRanges: true,
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    return NextResponse.json(
      { message: "Attendance record not found" },
      { status: 404 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const sameCompany = user.companyId === attendance.companyId;

  if (!isSuperAdmin && !sameCompany) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const employee = attendance.employee;
  const company = employee.company;

  if (!company) {
    return NextResponse.json(
      { message: "Employee has no company assigned" },
      { status: 400 }
    );
  }

  const deviceId = attendance.deviceId;

  // Update employee device lists
  const approvedSet = new Set(employee.approvedDeviceIds ?? []);
  approvedSet.add(deviceId);

  const newApproved = Array.from(approvedSet);
  const newUnverified = (employee.unverifiedDeviceIds ?? []).filter(
    (d) => d !== deviceId
  );

  // Build IpRange[] from whitelisted ranges
  const ipRanges =
    company.whitelistedIpRanges?.map((r) => ({
      minInt: ipToInt(r.minIpRange),
      maxInt: ipToInt(r.maxIpRange),
    })) ?? [];

  const result = validateAttendance({
    ip: attendance.loggedIp,
    deviceId,
    approvedDeviceIds: newApproved,
    unverifiedDeviceIds: newUnverified,
    whitelistedIpRanges: ipRanges,
  });

  // 🔧 FIX: normalize ipCheckDetails before spreading
  const existingDetails =
    typeof attendance.ipCheckDetails === "object" &&
    attendance.ipCheckDetails !== null &&
    !Array.isArray(attendance.ipCheckDetails)
      ? (attendance.ipCheckDetails as Record<string, any>)
      : {};

  const [updatedEmployee, updatedAttendance] = await Promise.all([
    db.employee.update({
      where: { id: employee.id },
      data: {
        approvedDeviceIds: newApproved,
        unverifiedDeviceIds: newUnverified,
      },
    }),
    db.attendance.update({
      where: { id: attendance.id },
      data: {
        verificationStatus: result.status, // "IN_OFFICE" | "REMOTE"
        isSuspicious: result.suspicious,
        ipCheckDetails: {
          ...existingDetails,
          deviceApprovedManually: true,
          deviceApprovedBy: user.id,
          deviceApprovedAt: new Date().toISOString(),
        },
      },
    }),
  ]);

  return NextResponse.json({
    attendance: updatedAttendance,
    employee: {
      id: updatedEmployee.id,
      approvedDeviceIds: updatedEmployee.approvedDeviceIds,
      unverifiedDeviceIds: updatedEmployee.unverifiedDeviceIds,
    },
  });
}
