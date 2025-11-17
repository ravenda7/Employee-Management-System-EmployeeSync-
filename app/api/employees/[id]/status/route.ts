import { db } from "@/lib/db";
import z from "zod";
import { NextRequest, NextResponse } from "next/server";

const updateSchema = z.object({
    isActive: z.boolean(),
});

interface EmployeeStatusAPI {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, context: EmployeeStatusAPI) {
    try {
        const params = await context.params;
        const employeeId = params.id;

        const body = await req.json();
        const data = updateSchema.parse(body);

        const updatedEmployee = await db.employee.update({
            where: { id: employeeId },
            data: {
                isActive: data.isActive,
            },
            select: {
                id: true,
                name: true,
                isActive: true,
            },
        });

        return new NextResponse(JSON.stringify(updatedEmployee), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Failed to update employee status" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}