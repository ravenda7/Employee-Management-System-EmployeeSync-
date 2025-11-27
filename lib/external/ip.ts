// lib/ip.ts
import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");

  // x-forwarded-for can be "ip1, ip2, ip3"
  let ip = fwd?.split(",")[0].trim() || realIp || "127.0.0.1";

  // Normalize localhost IPv6 to IPv4
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") {
    ip = "127.0.0.1";
  }

  // If still IPv6 and not localhost, fall back to 0.0.0.0 (will never match whitelist)
  if (ip.includes(":") && ip !== "127.0.0.1") {
    ip = "0.0.0.0";
  }

  return ip;
}


// lib/ip.ts
export function ipToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
}
