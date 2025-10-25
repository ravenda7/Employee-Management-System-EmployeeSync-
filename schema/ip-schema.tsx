import { z } from "zod";

export const ipToNumber = (ip: string): number => {
    try {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4) return NaN;
        return parts.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
    } catch (e) {
        return NaN;
    }
};

const ipv4Regex =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const IpSchema = z.object({
    minIpRange: z.string()
        .nonempty("Start IP Address is required")
        .regex(ipv4Regex, "Invalid Start IP Address format (must be IPv4)"),
    maxIpRange: z.string()
        .nonempty("End IP Address is required")
        .regex(ipv4Regex, "Invalid End IP Address format (must be IPv4)"),
    companyId: z.string("Invalid Company ID format"), // Add companyId to the schema
}).refine((data) => {
    const minIpNum = ipToNumber(data.minIpRange);
    const maxIpNum = ipToNumber(data.maxIpRange);
    return minIpNum <= maxIpNum;
}, {
    message: "Start IP Address must be less than or equal to End IP Address",
    path: ["minIpRange"], 
});

export type IpSchemaType = z.infer<typeof IpSchema>;