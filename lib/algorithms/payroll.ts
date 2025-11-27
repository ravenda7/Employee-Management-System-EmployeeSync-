// lib/payroll.ts

export type AttendanceRecordForPayroll = {
  timestamp: Date;
  type: "CHECK_IN" | "CHECK_OUT";
};

export type AllowanceItem = {
  id: string;
  type: string; // "medical", "transport", etc.
  amount: number;
};

export type DeductionItem = {
  id: string;
  type: string; // "tax", "late_fine", etc.
  amount: number;
};

export type PayrollCalculationInput = {
  attendances: AttendanceRecordForPayroll[];

  baseSalary: number;  // for the pay period (e.g. month)
  hourlyRate: number;  // derived or stored on employee

  allowances: AllowanceItem[];
  deductions: DeductionItem[];
};

export type WorkSession = {
  checkIn: Date;
  checkOut: Date | null;
  hours: number | null;
};

export type PayrollCalculationResult = {
  sessions: WorkSession[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  overtimePay: number;
  gross: number;
  net: number;
  allowanceTotal: number;
  deductionTotal: number;
  allowances: AllowanceItem[];
  deductions: DeductionItem[];
};

function sumAmount(list: { amount: number }[]): number {
  return list.reduce((sum, item) => sum + (item.amount || 0), 0);
}

/**
 * Pair CHECK_IN / CHECK_OUT into sessions.
 */
export function buildWorkSessions(
  attendances: AttendanceRecordForPayroll[]
): WorkSession[] {
  if (!attendances.length) return [];

  const sorted = [...attendances].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  const sessions: WorkSession[] = [];
  let currentCheckIn: Date | null = null;

  for (const rec of sorted) {
    if (rec.type === "CHECK_IN") {
      if (currentCheckIn) {
        sessions.push({
          checkIn: currentCheckIn,
          checkOut: null,
          hours: null,
        });
      }
      currentCheckIn = rec.timestamp;
    } else {
      if (!currentCheckIn) continue;
      const checkOut = rec.timestamp;
      const diffMs = checkOut.getTime() - currentCheckIn.getTime();
      const hours = diffMs > 0 ? diffMs / (1000 * 60 * 60) : 0;
      sessions.push({
        checkIn: currentCheckIn,
        checkOut,
        hours,
      });
      currentCheckIn = null;
    }
  }

  if (currentCheckIn) {
    sessions.push({
      checkIn: currentCheckIn,
      checkOut: null,
      hours: null,
    });
  }

  return sessions;
}

/**
 * - 8 hours per day counted as regular, above that is overtime.
 * - baseSalary is fixed for the period.
 * - overtimePay = 1.5 * hourlyRate * overtimeHours
 * - gross = baseSalary + overtimePay + allowanceTotal
 * - net = gross - deductionTotal
 */
export function calculatePayrollForPeriod(
  input: PayrollCalculationInput
): PayrollCalculationResult {
  const sessions = buildWorkSessions(input.attendances);

  let totalHours = 0;
  let overtimeHours = 0;

  for (const s of sessions) {
    if (s.hours == null || s.hours <= 0) continue;

    totalHours += s.hours;

    if (s.hours > 8) {
      overtimeHours += s.hours - 8;
    }
  }

  const regularHours = Math.max(totalHours - overtimeHours, 0);

  const allowanceTotal = sumAmount(input.allowances);
  const deductionTotal = sumAmount(input.deductions);

  const overtimePay = 1.5 * input.hourlyRate * overtimeHours;
  const gross = input.baseSalary + overtimePay + allowanceTotal;
  const net = gross - deductionTotal;

  return {
    sessions,
    totalHours,
    regularHours,
    overtimeHours,
    overtimePay,
    gross,
    net,
    allowanceTotal,
    deductionTotal,
    allowances: input.allowances,
    deductions: input.deductions,
  };
}
