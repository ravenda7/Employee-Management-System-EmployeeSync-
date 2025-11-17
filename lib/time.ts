// lib/time.ts

const TIME_REGEX = /^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/;

/**
 * Parse "09:00 AM" / "18:30" into a Date with LOCAL time
 * on dummy date 1970-01-01.
 */
export function parseTimeStringToDate(timeStr: string): Date {
  const match = timeStr.trim().match(TIME_REGEX);
  if (!match) {
    throw new Error(`Invalid time format: "${timeStr}". Expected HH:MM or HH:MM AM/PM.`);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toUpperCase(); // "AM" | "PM" | undefined

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid numbers in time string: "${timeStr}".`);
  }

  if (minute < 0 || minute > 59) {
    throw new Error(`Minute must be between 00–59 in: "${timeStr}".`);
  }

  if (meridiem) {
    // 12h format
    if (hour < 1 || hour > 12) {
      throw new Error(`Hour must be 1–12 for AM/PM format: "${timeStr}".`);
    }
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
  } else {
    // 24h format
    if (hour < 0 || hour > 23) {
      throw new Error(`Hour must be 00–23 in 24h format: "${timeStr}".`);
    }
  }

  // IMPORTANT: LOCAL time (no Date.UTC)
  return new Date(1970, 0, 1, hour, minute, 0, 0);
}

/**
 * Convert time-only Date (1970-01-01 in LOCAL time) to "hh:mm AM/PM"
 */
export function formatDateToTimeString(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  const hours = date.getHours(); // LOCAL
  const minutes = date.getMinutes();

  const isPM = hours >= 12;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minuteStr = minutes.toString().padStart(2, "0");

  return `${hour12}:${minuteStr} ${isPM ? "PM" : "AM"}`;
}

/**
 * Apply baseTime's time-of-day to targetDate (LOCAL time).
 * baseTime: 1970-01-01 18:00 (6pm)
 * targetDate: 2025-11-16 xx:xx
 * => 2025-11-16 18:00
 */
export function buildDateWithTime(baseTime: Date, targetDate: Date): Date {
  const hours = baseTime.getHours();
  const minutes = baseTime.getMinutes();

  const d = new Date(targetDate);
  d.setHours(hours, minutes, 0, 0); // LOCAL
  return d;
}

/**
 * later - earlier in minutes (rounded).
 */
export function diffMinutes(later: Date, earlier: Date): number {
  const ms = later.getTime() - earlier.getTime();
  return Math.round(ms / (1000 * 60));
}
