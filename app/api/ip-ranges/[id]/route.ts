import { db } from '@/lib/db';
import { IpSchema } from '@/schema/ip-schema';
import { NextResponse } from 'next/server';

interface ApiContext {
    params: Promise<{
        id: string; 
    }>;
}

export async function PATCH(req: Request, context: ApiContext) {
    const params = await context.params;
    const rangeId = params.id; 

    try {
        const { minIpRange, maxIpRange } = await req.json();
        const validation = IpSchema.partial().safeParse({ minIpRange, maxIpRange });

        if (!validation.success) {
            return NextResponse.json({ 
                message: "Validation failed", 
                errors: validation.error.message
            }, { status: 400 });
        }
        
        // 2. Perform the update
        const updatedRange = await db.whitelistedIpRange.update({
            where: { id: rangeId },
            data: validation.data,
        });

        return NextResponse.json({ 
            message: "IP Range updated successfully", 
            range: updatedRange 
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating IP range:', error);
        // Handle case where the ID does not exist
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            return NextResponse.json({ message: "IP Range not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "An unexpected error occurred during update." }, { status: 500 });
    }
}


// --- DELETE Handler (Delete IP Range) ---
export async function DELETE(req: Request, context: ApiContext) {
    const params = await context.params;
    const rangeId = params.id; 

    try {
        await db.whitelistedIpRange.delete({
            where: {
                id: rangeId,
            },
        });

        return new NextResponse(null, { status: 204 }); // 204 No Content for successful deletion

    } catch (error) {
        console.error('Error deleting IP range:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
             return NextResponse.json({ message: "IP Range not found." }, { status: 404 });
        }
        return NextResponse.json({ message: "An unexpected error occurred during deletion" }, { status: 500 });
    }
}