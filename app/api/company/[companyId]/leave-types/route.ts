// app/api/company/[companyId]/leave-types/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

interface CompanyContext {
  params: Promise<{ companyId: string }>;
}

function canManageLeaveTypes(role: string) {
  return (
    role === "SUPER_ADMIN" ||
    role === "COMPANY_ADMIN" ||
    role === "COMPANY_HR"
  );
}

// GET: list leave types for company
export async function GET(_req: NextRequest, context: CompanyContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const { companyId } = await context.params;

  if (!user?.id || !user.companyId || user.companyId !== companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const leaveTypes = await db.leaveType.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(leaveTypes);
}

// POST: create leave type
export async function POST(req: NextRequest, context: CompanyContext) {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const { companyId } = await context.params;

  if (!user?.id || !user.companyId || user.companyId !== companyId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageLeaveTypes(user.role)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    code,
    yearlyLimit,
    isPaid = true,
    requiresApproval = true,
  } = body as {
    name?: string;
    code?: string;
    yearlyLimit?: number | null;
    isPaid?: boolean;
    requiresApproval?: boolean;
  };

  if (!name || !code) {
    return NextResponse.json(
      { message: "name and code are required" },
      { status: 400 }
    );
  }

  // normalize code (e.g. "sl", "Sick" -> "SICK")
  const normalizedCode = code.trim().toUpperCase();

  try {
    const created = await db.leaveType.create({
      data: {
        companyId,
        name: name.trim(),
        code: normalizedCode,
        yearlyLimit: yearlyLimit ?? null,
        isPaid,
        requiresApproval,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    // likely unique constraint violation
    return NextResponse.json(
      { message: error.message || "Failed to create leave type" },
      { status: 500 }
    );
  }
}
