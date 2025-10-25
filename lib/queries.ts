import { cache } from "react";
import { db } from "./db";
import { WhitelistedIpRange } from "./generated/prisma";

export interface SidebarData {
    name: string;
    companyId: string;
    email: string;
    companyName: string;
    role: string;
}


// export async function getCompanyDetails(companyId: string): Promise<{ companyName: string } | null> {
//     const company = await db.company.findUnique({
//       where: { id: companyId },
//       select: { name: true },
//     });
  
//     if (!company) {
//       return null;
//     }
//     return { companyName: company.name };
// }

/**
 * Fetches company name for display in the sidebar.
 */
export const getCompanyDetails = cache(async (companyId: string): Promise<{ companyName: string } | null> => {
    if (!companyId) return null;
    
    try {
        const company = await db.company.findUnique({
            where: { id: companyId },
            select: { name: true },
        });
        
        return company ? { companyName: company.name } : null;
    } catch (error) {
        console.error("Prisma error fetching company details:", error);
        return null;
    }
});



// Fetch data of ip address
export const getIpRangesByCompany = cache(async (companyId: string): Promise<WhitelistedIpRange[]> => {
    if (!companyId) {
        console.error("Attempted to fetch IP ranges without a company ID.");
        return [];
    }
    
    try {
        const ranges = await db.whitelistedIpRange.findMany({
            where: { companyId },
            orderBy: { createdAt: 'asc' },
        });
        return ranges;
    } catch (error) {
        console.error("Prisma error while fetching IP ranges:", error);
        return []; 
    }
});