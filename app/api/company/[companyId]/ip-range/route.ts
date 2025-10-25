import { NextResponse } from 'next/server';
import { IpSchema, IpSchemaType } from '@/schema/ip-schema';
import { db } from '@/lib/db';


interface ApiContext {
    params: Promise<{
        companyId: string;
    }>;
}

export async function POST(req: Request, context: ApiContext) {
    const params = await context.params;
    const companyId = params.companyId; 

    try {
        const { minIpRange, maxIpRange } = await req.json();
        const validation = IpSchema.safeParse({ minIpRange, maxIpRange, companyId });
        
        if (!validation.success) {
            return NextResponse.json({ 
                message: "Validation failed", 
                errors: validation.error
            }, { status: 400 });
        }

        const newRange = await db.whitelistedIpRange.create({
            data: {
                companyId: companyId,
                minIpRange: minIpRange,
                maxIpRange: maxIpRange,
            },
        });

        return NextResponse.json({ 
            message: "IP Range added successfully", 
            range: newRange 
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding IP range:', error);
        return NextResponse.json({ 
            message: "An unexpected error occurred while adding the IP range." 
        }, { status: 500 });
    }
}



export async function GET(req: Request, context: ApiContext) {
    const params = await context.params;
    const companyId = params.companyId; 

    if (!companyId) {
        return NextResponse.json({ message: "Company ID is required" }, { status: 400 });
    }

    try {
        const ipRanges = await db.whitelistedIpRange.findMany({
            where: {
                companyId: companyId,
            },
            orderBy: {
                createdAt: 'asc', // Show the oldest ranges first
            },
        });

        return NextResponse.json(ipRanges);

    } catch (error) {
        console.error('Error fetching IP ranges:', error);
        return NextResponse.json({ 
            message: "An error occurred while fetching IP ranges" 
        }, { status: 500 });
    }
}