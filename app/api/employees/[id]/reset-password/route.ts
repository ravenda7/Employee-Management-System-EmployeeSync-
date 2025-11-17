import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";


interface EmployeePasswordAPI {
    params: Promise<{
      id: string;
    }>;
}

export async function PATCH(req: NextRequest, context: EmployeePasswordAPI) {
    try {
        const params = await context.params;
        const employeeId = params.id;

        const employee = await db.employee.findUnique({
            where: { id: employeeId },
        });

        if(!employee) {
            return new NextResponse(JSON.stringify({ error: "Employee not found" }), 
            {status: 404 })
        }

        const body = await req.json();
        const { newPassword } = body;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const update = await db.employee.update({
            where: { id: employeeId },
            data: {
                hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        return new NextResponse(JSON.stringify(update), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        })


    } catch (error) {
        return new NextResponse(JSON.stringify({ error: "Failed to update employee password" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}