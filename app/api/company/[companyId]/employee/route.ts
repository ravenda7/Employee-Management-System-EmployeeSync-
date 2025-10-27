import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

interface EmployeeContext {
    params: Promise<{ companyId: string }>;
}

export async function POST(req: NextRequest, context: EmployeeContext) {
    try {
        const params = await context.params;
        const companyId = params.companyId;

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string; // Required for setup
        const role = formData.get("role") as 'COMPANY_HR' | 'EMPLOYEE'; // Optional, but must be one of these
        const departmentIdRaw = formData.get("departmentId") as string | null;
        const baseSalaryRaw = formData.get("baseSalary") as string | null;
        const image = formData.get("image") as File | null; // The avatar file

        // --- 2. Basic Validation ---
        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields: name, email, and password are mandatory." }, 
                { status: 400 }
            );
        }

        // --- 3. Role Validation ---
        const finalRole = role && ['COMPANY_HR', 'EMPLOYEE'].includes(role) ? role : 'EMPLOYEE';

        // --- 4. Check for existing employee ---
        const existing = await db.employee.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ message: "Employee with this email already exists." }, { status: 409 });
        }

        // --- 5. Process Salary and Hourly Rate ---
        const baseSalaryFloat = baseSalaryRaw ? parseFloat(baseSalaryRaw) : 30000.0;
        const monthlyHours = 160;
        const hourlyRate = baseSalaryFloat / monthlyHours;
        
        // --- 6. Hash Password ---
        const hashedPassword = await bcrypt.hash(password, 10);
        
        let avatarUrl: string | null = null;
        
        // --- 7. Handle File Upload (Avatar) ---
        if (image && image.size > 0) {
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);
            
            // Create a safe, unique file name
            const fileName = `${Date.now()}-${name.replace(/\s+/g, "-").substring(0, 10)}.jpg`;
            const uploadPath = path.join(process.cwd(), "public/uploads", fileName);
            
            await writeFile(uploadPath, buffer);
            
            // Store the public path
            avatarUrl = `/uploads/${fileName}`;
        }
        
        // --- 8. Create Employee Record ---
        const newEmployee = await db.employee.create({
            data: {
                companyId,
                name,
                email,
                hashedPassword,
                role: finalRole,
                baseSalary: baseSalaryFloat,
                hourlyRate: hourlyRate,
                avatarUrl,
                joinDate: new Date(),
                departmentId: departmentIdRaw ?? null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                baseSalary: true,
                joinDate: true,
                companyId: true,
            }
        });

        // --- 9. Success Response ---
        return NextResponse.json({ 
            message: "Employee successfully added.", 
            employee: newEmployee 
        }, { status: 201 });

    } catch (error) {
        console.error('Error adding Employee:', error);
        return NextResponse.json({ 
            message: "An unexpected error occurred while adding the Employee." 
        }, { status: 500 });
    }
}
    