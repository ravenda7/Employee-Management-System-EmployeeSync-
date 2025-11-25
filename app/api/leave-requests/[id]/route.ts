// app/api/leave-request/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { authOptions } from "../../auth/[...nextauth]/route";
import { sendLeaveDecisionEmail } from "@/helpers/send-leave-decission-email";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  decisionNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, decisionNote } = parsed.data;

  const leave = await db.leave.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyId: true,
      empId: true,
      status: true,
    },
  });

  if (!leave) {
    return NextResponse.json(
      { message: "Leave request not found" },
      { status: 404 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const sameCompany = user.companyId === leave.companyId;

  if (!isSuperAdmin && !sameCompany) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (leave.status === status) {
    return NextResponse.json(
      { message: "Leave is already in that status" },
      { status: 200 }
    );
  }

  const updated = await db.leave.update({
    where: { id: leave.id },
    data: {
      status,
      decisionNote: decisionNote ?? null,
      decidedById: user.id,
      // updatedAt handled by @updatedAt
    },
    include: {
      employee: {
        select: { id: true, name: true, email: true },
      },
      leaveType: {
        select: { name: true },
      },
      company: {
        select: { name: true },
      },
    },
  });

if (updated.employee.email && updated.employee.name) {
    const dashboardUrl =
      `${process.env.NEXT_PUBLIC_BASE_URL}/employee/dashboard` || "";

    const emailResponse = await sendLeaveDecisionEmail({
      employeeName: updated.employee.name,
      employeeEmail: updated.employee.email,
      companyName: updated.company.name,
      leaveType: updated.leaveType.name,
      startDate: updated.startDate.toDateString(),
      endDate: updated.endDate.toDateString(),
      duration: updated.duration,
      status, // "APPROVED" | "REJECTED"
      decisionNote: decisionNote ?? undefined,
      dashboardUrl,
    });

    if (!emailResponse.success) {
      console.error(
        "Failed to send leave decision email:",
        emailResponse.message
      );
    }
  }


  return NextResponse.json(updated);
}
