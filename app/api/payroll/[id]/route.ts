// app/api/payroll/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const bodySchema = z.object({
  isPaid: z.boolean(),
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

  const payrollId = params.id;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { isPaid } = parsed.data;

  // Load payroll with company + employee to enforce multi-tenant isolation
  const existing = await db.payroll.findUnique({
    where: { id: payrollId },
    select: {
      id: true,
      companyId: true,
      empId: true,
      isPaid: true,
      paidDate: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { message: "Payroll record not found" },
      { status: 404 }
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const sameCompany = user.companyId === existing.companyId;
  const isCompanyAdminOrHr =
    (user.role === "COMPANY_ADMIN" || user.role === "COMPANY_HR") &&
    sameCompany;

  if (!isSuperAdmin && !isCompanyAdminOrHr) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const updated = await db.payroll.update({
    where: { id: payrollId },
    data: {
      isPaid,
      paidDate: isPaid ? now : null,
    },
  });

  return NextResponse.json(updated);
}
