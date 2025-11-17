import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

interface EmployeeAPI {
    params: Promise<{ id: string }>
}

export async function DELETE(_req: NextRequest, context: EmployeeAPI) {

    try {
        const params = await context.params
        const employeeId = params.id;

        await db.employee.delete({
            where: { id: employeeId },
        });

        return NextResponse.json({ message: "Employee deleted"})
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
    }
}


export async function PATCH(req: NextRequest, context: EmployeeAPI) {
  try {
    const params = await context.params;
    const employeeId = params.id;

    // --- 1. Check if employee exists ---
    const existingEmployee = await db.employee.findUnique({
      where: { id: employeeId },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    // --- 2. Parse form data ---
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const departmentIdRaw = formData.get("departmentId") as string | null;
    const shiftIdRaw = formData.get("shiftId") as string | null;
    const baseSalaryRaw = formData.get("baseSalary") as string | null;
    const image = formData.get("image") as File | null;

    // --- 3. Validate required fields ---
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required." },
        { status: 400 }
      );
    }

    // --- 4. Check for duplicate email (excluding the same employee) ---
    const existingEmail = await db.employee.findFirst({
      where: {
        email,
        NOT: { id: employeeId },
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: "Another employee with this email already exists." },
        { status: 409 }
      );
    }

    // --- 5. Salary + hourly rate calculation ---
    const baseSalary = baseSalaryRaw
      ? parseFloat(baseSalaryRaw)
      : existingEmployee.baseSalary || 0;
    const monthlyHours = 160;
    const hourlyRate = baseSalary / monthlyHours;

    // --- 6. Handle image upload (if provided) ---
    let avatarUrl = existingEmployee.avatarUrl;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const fileName = `${Date.now()}-${name.replace(/\s+/g, "-").substring(0, 10)}.jpg`;
      const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

      await writeFile(uploadPath, buffer);
      avatarUrl = `/uploads/${fileName}`;
    }

    // --- 7. Update employee record ---
    const updatedEmployee = await db.employee.update({
      where: { id: employeeId },
      data: {
        name,
        email,
        departmentId: departmentIdRaw ?? null,
        shiftId: shiftIdRaw ?? null,
        baseSalary,
        hourlyRate,
        avatarUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        baseSalary: true,
        departmentId: true,
      },
    });

    // --- 8. Return success ---
    return NextResponse.json(
      {
        message: "Employee updated successfully.",
        employee: updatedEmployee,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while updating the Employee." },
      { status: 500 }
    );
  }
}
