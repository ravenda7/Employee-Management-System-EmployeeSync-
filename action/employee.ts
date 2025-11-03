import { cache } from "react";
import { db } from "@/lib/db";


export const getEmployeeById = cache(async (id: string) => {
    if (!id) return null;

    try {
        const employee = await db.employee.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                departmentId: true,
                baseSalary: true,
            }
        });

        return employee;
    } catch (error) {
        console.error("Prisma error fetching company details:", error);
        return null;
    }
})