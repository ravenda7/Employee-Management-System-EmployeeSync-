// app/api/leave-type/[leaveTypeId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";

interface LeaveTypeContext {
  params: Promise<{ leaveTypeId: string }>;
}

function canManageLeaveTypes(role: string) {
  return (
    role === "SUPER_ADMIN" ||
    role === "COMPANY_ADMIN" ||
    role === "COMPANY_HR"
  );
}

// PATCH: update leave type
export async function PATCH(req: NextRequest, context: LeaveTypeContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const { leaveTypeId } = await context.params;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageLeaveTypes(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const existing = await db.leaveType.findUnique({
    where: { id: leaveTypeId },
  });

  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const {
    name,
    code,
    yearlyLimit,
    isPaid,
    requiresApproval,
  } = body as {
    name?: string;
    code?: string;
    yearlyLimit?: number | null;
    isPaid?: boolean;
    requiresApproval?: boolean;
  };

  const updateData: any = {};

  if (typeof name === "string") updateData.name = name.trim();
  if (typeof code === "string")
    updateData.code = code.trim().toUpperCase();
  if (typeof yearlyLimit === "number" || yearlyLimit === null)
    updateData.yearlyLimit = yearlyLimit;
  if (typeof isPaid === "boolean") updateData.isPaid = isPaid;
  if (typeof requiresApproval === "boolean")
    updateData.requiresApproval = requiresApproval;

  try {
    const updated = await db.leaveType.update({
      where: { id: leaveTypeId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update leave type" },
      { status: 500 }
    );
  }
}

// DELETE: delete leave type (only if no leaves use it)
export async function DELETE(_req: NextRequest, context: LeaveTypeContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const { leaveTypeId } = await context.params;

  if (!user?.id || !user.companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageLeaveTypes(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const existing = await db.leaveType.findUnique({
    where: { id: leaveTypeId },
    include: {
      _count: {
        select: { leaves: true },
      },
    },
  });

  if (!existing || existing.companyId !== user.companyId) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  if (existing._count.leaves > 0) {
    return NextResponse.json(
      {
        message:
          "Cannot delete leave type that is already used by existing leaves.",
      },
      { status: 400 }
    );
  }

  await db.leaveType.delete({
    where: { id: leaveTypeId },
  });

  return NextResponse.json({ success: true });
}
