// app/api/company/[companyId]/payrolls/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  calculatePayrollForPeriod,
  AttendanceRecordForPayroll,
  AllowanceItem,
  DeductionItem,
} from "@/lib/algorithms/payroll";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const bodySchema = z.object({
  empId: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  manualDeductions: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return 0;
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    }),
  note: z.string().optional(),
  simulateOnly: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdminOrHr =
    (user.role === "COMPANY_ADMIN" || user.role === "COMPANY_HR") &&
    user.companyId === companyId;

  if (!isSuperAdmin && !isCompanyAdminOrHr) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { empId, startDate, endDate, manualDeductions, note, simulateOnly } =
    parsed.data;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json(
      { message: "Invalid startDate or endDate" },
      { status: 400 }
    );
  }

  if (end < start) {
    return NextResponse.json(
      { message: "endDate cannot be before startDate" },
      { status: 400 }
    );
  }

  const endInclusive = new Date(end);
  endInclusive.setHours(23, 59, 59, 999);

  const employee = await db.employee.findFirst({
    where: { id: empId, companyId },
    select: {
      id: true,
      name: true,
      companyId: true,
      baseSalary: true,
      hourlyRate: true,
      allowances: true,
    },
  });

  if (!employee) {
    return NextResponse.json(
      { message: "Employee not found in this company" },
      { status: 404 }
    );
  }

  const baseSalary = employee.baseSalary ?? 0;
  const hourlyRate =
    employee.hourlyRate ??
    (employee.baseSalary ? employee.baseSalary / 160 : 0);

  const rawAllowances = Array.isArray(employee.allowances)
    ? (employee.allowances as any[])
    : [];

  const allowances: AllowanceItem[] = rawAllowances.map((a, idx) => ({
    id: String(a.id ?? `auto-${idx}`),
    type: String(a.type ?? "other"),
    amount: Number(a.amount ?? 0),
  }));

  const deductions: DeductionItem[] =
    manualDeductions && manualDeductions > 0
      ? [{ id: "manual", type: "manual", amount: manualDeductions }]
      : [];

  const attendanceRecords = await db.attendance.findMany({
    where: {
      companyId,
      empId: employee.id,
      timestamp: { gte: start, lte: endInclusive },
    },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true, type: true },
  });

  const normalizedAttendances: AttendanceRecordForPayroll[] =
    attendanceRecords.map((a) => ({
      timestamp: a.timestamp,
      type: a.type as "CHECK_IN" | "CHECK_OUT",
    }));

  const calcResult = calculatePayrollForPeriod({
    attendances: normalizedAttendances,
    baseSalary,
    hourlyRate,
    allowances,
    deductions,
  });

  if (simulateOnly) {
    return NextResponse.json({
      mode: "preview",
      employee: { id: employee.id, name: employee.name },
      period: { start, end: endInclusive },
      summary: {
        baseSalary,
        hourlyRate,
        totalHours: calcResult.totalHours,
        regularHours: calcResult.regularHours,
        overtimeHours: calcResult.overtimeHours,
        overtimePay: calcResult.overtimePay,
        allowanceTotal: calcResult.allowanceTotal,
        deductionTotal: calcResult.deductionTotal,
        gross: calcResult.gross,
        net: calcResult.net,
      },
      allowances: calcResult.allowances,
      deductions: calcResult.deductions,
    });
  }

  const payroll = await db.payroll.create({
    data: {
      companyId,
      empId: employee.id,
      startDate: start,
      endDate: endInclusive,
      gross: calcResult.gross,
      deductions: calcResult.deductionTotal,
      net: calcResult.net,
      regularHours: calcResult.regularHours,
      overtimeHours: calcResult.overtimeHours,
      isPaid: false,
      note: note ?? null,
    },
  });

  return NextResponse.json({
    mode: "created",
    payroll,
    summary: {
      baseSalary,
      hourlyRate,
      totalHours: calcResult.totalHours,
      regularHours: calcResult.regularHours,
      overtimeHours: calcResult.overtimeHours,
      overtimePay: calcResult.overtimePay,
      allowanceTotal: calcResult.allowanceTotal,
      deductionTotal: calcResult.deductionTotal,
      gross: calcResult.gross,
      net: calcResult.net,
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId;

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isCompanyAdminOrHr =
    (user.role === "COMPANY_ADMIN" || user.role === "COMPANY_HR") &&
    user.companyId === companyId;

  if (!isSuperAdmin && !isCompanyAdminOrHr) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const empId = searchParams.get("empId");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const from = fromParam ? new Date(fromParam) : monthStart;
  const to = toParam ? new Date(toParam) : monthEnd;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json(
      { message: "Invalid from/to query" },
      { status: 400 }
    );
  }

  const where: any = {
    companyId,
    startDate: { gte: from },
    endDate: { lte: to },
  };

  if (empId) where.empId = empId;

  const payrolls = await db.payroll.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      employee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json(payrolls);
}
