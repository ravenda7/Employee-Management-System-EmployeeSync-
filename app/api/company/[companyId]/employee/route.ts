import { sendCredientalsEmail } from "@/helpers/send-credientals-email";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { DEFAULT_PERMISSIONS_BY_ROLE } from "@/lib/permission";
import { Role } from "@/lib/generated/prisma";

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
    const temporaryPassword = formData.get("password") as string; // for sending raw password to emplyee email
    const password = formData.get("password") as string; // Required for setup

    // 🔹 change type to generic string, we’ll cast to Role safely
    const roleRaw = formData.get("role") as string | null;

    const departmentIdRaw = formData.get("departmentId") as string | null;
    const shiftIdRaw = formData.get("shiftId") as string | null;
    const baseSalaryRaw = formData.get("baseSalary") as string | null;
    const image = formData.get("image") as File | null; // The avatar file

    // --- 2. Basic Validation ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields: name, email, and password are mandatory." },
        { status: 400 }
      );
    }

    // --- 3. Role Validation + default ---
    const allowedRoles: Role[] = ["COMPANY_HR", "EMPLOYEE"]; // you only allow these from UI

    let finalRole: Role = "EMPLOYEE"; // default

    if (roleRaw && allowedRoles.includes(roleRaw as Role)) {
      finalRole = roleRaw as Role;
    }

    // 🔹 3.1 Get default permissions for this role
    const defaultPermissions =
      DEFAULT_PERMISSIONS_BY_ROLE[finalRole] ?? [];

    // --- 4. Check for existing employee ---
    const existing = await db.employee.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { message: "Employee with this email already exists." },
        { status: 409 }
      );
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

      const fileName = `${Date.now()}-${name
        .replace(/\s+/g, "-")
        .substring(0, 10)}.jpg`;
      const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

      await writeFile(uploadPath, buffer);

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
        shiftId: shiftIdRaw ?? null,
        // 🔹 save permissions here
        permissions: defaultPermissions,
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
      },
    });

    // --- Get the company name ---
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true, adminEmail: true },
    });

    const companyName = company?.name || "Example Company";
    const supportEmail = company?.adminEmail || "support@example.com";

    // --- Send credentials email ---
    const emailResponse = await sendCredientalsEmail(
      newEmployee.name,
      companyName,
      `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
      supportEmail,
      temporaryPassword,
      newEmployee.email
    );

    if (!emailResponse.success) {
      console.error(
        "Failed to send credentials email:",
        emailResponse.message
      );
    }

    // --- 9. Success Response ---
    return NextResponse.json(
      {
        message: "Employee successfully added.",
        employee: newEmployee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding Employee:", error);
    return NextResponse.json(
      {
        message: "An unexpected error occurred while adding the Employee.",
      },
      { status: 500 }
    );
  }
}

    

const MANDATORY_ROLES = ["COMPANY_HR", "EMPLOYEE"]; 

export async function GET(req: NextRequest, context: EmployeeContext) {
    try {
        // --- 1. Extract Path and Query Parameters ---
        const params = await context.params;
        const companyId = params.companyId;

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        // Capture page and limit values
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const department = searchParams.get("department");
        const requestedRole = searchParams.get("role"); 

        // --- 2. Construct Where Clause with Role Filtering ---
        
        // Determine the final set of roles to use for the filter
        const rolesToFilterBy = requestedRole && MANDATORY_ROLES.includes(requestedRole)
            ? [requestedRole as any] // If a valid, allowed role is requested, filter by it
            : (MANDATORY_ROLES as any); // Otherwise, use the default mandatory set
            
        const finalWhere = {
            // Must belong to the company
            companyId,
            
            // Search filter by name (case-insensitive)
            name: { contains: search, mode: "insensitive" as const },
            
            // Department filter (optional)
            ...(department && { departmentId: department }),
            
            // Role filter (mandatory constraint, optional narrowing by user)
            role: {
                in: rolesToFilterBy 
            }
        };


        // --- 3. Fetch Employees and Total Count ---
        const employees = await db.employee.findMany({
            where: finalWhere,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                name: "asc"
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatarUrl: true,
                baseSalary: true,
                joinDate: true,
                isActive: true,
                departmentId: true,
                department: true,
                allowances: true,
            }
        });

        const totalEmployees = await db.employee.count({ where: finalWhere });

        // --- 4. Return Response in the Desired Format ---
        return NextResponse.json({
            data: {
                employees,
                total: totalEmployees, // Renamed from totalEmployees to total
                page,                  // Added page number
                limit                  // Added limit per page
            }
        });

    } catch (error) {
        console.error('Error fetching Employees:', error);
        return NextResponse.json({
            message: "An unexpected error occurred while fetching Employees."
        }, { status: 500 });
    }
}