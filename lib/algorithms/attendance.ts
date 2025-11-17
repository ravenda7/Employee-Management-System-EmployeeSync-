// lib/attendance.ts

export type VerificationStatus = "IN_OFFICE" | "REMOTE" | "MANUAL_ADJUSTMENT";

export interface IpRange {
  minInt: number;
  maxInt: number;
}

export interface AttendanceValidationInput {
  ip: string;
  deviceId: string;
  approvedDeviceIds: string[];
  unverifiedDeviceIds: string[];
  whitelistedIpRanges: IpRange[];
}

export interface AttendanceValidationResult {
  status: VerificationStatus;
  suspicious: boolean;
  shouldAddToUnverified: boolean;
}

export function ipToInt(ip: string): number {
  return (
    ip
      .split(".")
      .reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0
  );
}

export function validateAttendance(
  input: AttendanceValidationInput
): AttendanceValidationResult {
  const {
    ip,
    deviceId,
    approvedDeviceIds,
    unverifiedDeviceIds,
    whitelistedIpRanges,
  } = input;

  const ipInt = ipToInt(ip);

  // IP whitelist check
  let inOfficeRange = false;
  for (const range of whitelistedIpRanges) {
    if (ipInt >= range.minInt && ipInt <= range.maxInt) {
      inOfficeRange = true;
      break;
    }
  }

  const isApproved = approvedDeviceIds.includes(deviceId);
  const isAlreadyUnverified = unverifiedDeviceIds.includes(deviceId);

  const status: VerificationStatus =
    inOfficeRange && isApproved ? "IN_OFFICE" : "REMOTE";

  const suspicious = !isApproved;
  const shouldAddToUnverified = suspicious && !isAlreadyUnverified;

  return {
    status,
    suspicious,
    shouldAddToUnverified,
  };
}
