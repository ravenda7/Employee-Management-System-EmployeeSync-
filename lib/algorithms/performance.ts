// lib/algorithms/performance.ts

export interface AttendanceForPerf {
  dateKey: string; // "YYYY-MM-DD"
  isPresent: boolean;
  isOnTime: boolean;
}

export interface LeaveForPerf {
  duration: number; // days in the period
}

export function calculatePerformanceScore(
  attendanceDays: AttendanceForPerf[],
  leaves: LeaveForPerf[],
  workingDays: number
): {
  score: number;
  attendanceRatio: number;
  punctualityRatio: number;
  leaveRatio: number;
} {
  if (workingDays <= 0) {
    return {
      score: 0,
      attendanceRatio: 0,
      punctualityRatio: 0,
      leaveRatio: 0,
    };
  }

  const presentDays = attendanceDays.filter((d) => d.isPresent).length;
  const onTimeDays = attendanceDays.filter((d) => d.isOnTime).length;
  const totalCheckInDays = attendanceDays.length || 1;

  const totalLeaveDays = leaves.reduce((sum, l) => sum + (l.duration || 0), 0);

  const A = presentDays / workingDays; // attendance ratio
  const P = onTimeDays / totalCheckInDays; // punctuality ratio
  const L = totalLeaveDays / workingDays; // leave ratio

  // Weighted score: 0.5 * attendance + 0.3 * punctuality + 0.2 * (1 - leaveRatio)
  const score = 0.5 * A + 0.3 * P + 0.2 * (1 - L);

  return {
    score: Math.max(0, Math.min(1, score)), // clamp between 0 and 1
    attendanceRatio: A,
    punctualityRatio: P,
    leaveRatio: L,
  };
}
