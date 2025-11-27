// app/api/profile/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

function canEditProfile(currentUser: any, targetEmployee: any): boolean {
  if (!currentUser) return false;

  // Super admin can do anything
  if (currentUser.role === "SUPER_ADMIN") return true;

  // Self
  if (currentUser.id === targetEmployee.id) return true;

  // Company admin / HR can edit profiles within same company
  const isCompanyAdminOrHr =
    currentUser.role === "COMPANY_ADMIN" || currentUser.role === "COMPANY_HR";

  if (
    isCompanyAdminOrHr &&
    currentUser.companyId &&
    currentUser.companyId === targetEmployee.companyId
  ) {
    return true;
  }

  return false;
}

// ---------- GET /api/profile/[id] ----------
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const employee = await db.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      companyId: true,
      department: {
        select: { name: true },
      },
      shift: {
        select: { name: true },
      },
      joinDate: true,
      isActive: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  if (!canEditProfile(user, employee)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: employee.id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    avatarUrl: employee.avatarUrl,
    companyId: employee.companyId,
    departmentName: employee.department?.name ?? null,
    shiftName: employee.shift?.name ?? null,
    joinDate: employee.joinDate,
    isActive: employee.isActive,
  });
}

// ---------- PATCH /api/profile/[id] ----------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const employee = await db.employee.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      companyId: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  if (!canEditProfile(user, employee)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData();
  const name = (formData.get("name") as string | null)?.trim() ?? null;
  const image = formData.get("image") as File | null;

  if (!name) {
    return NextResponse.json(
      { message: "Name is required" },
      { status: 400 }
    );
  }

  let avatarUrl: string | undefined;

  if (image && image.size > 0) {
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadsDir, { recursive: true });

    const safeName = name.replace(/\s+/g, "-").toLowerCase().substring(0, 20);
    const fileName = `${Date.now()}-${safeName || "avatar"}.jpg`;
    const uploadPath = path.join(uploadsDir, fileName);

    await writeFile(uploadPath, buffer);
    avatarUrl = `/uploads/${fileName}`;
  }

  const updated = await db.employee.update({
    where: { id: params.id },
    data: {
      name,
      ...(avatarUrl ? { avatarUrl } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({
    message: "Profile updated",
    employee: updated,
  });
}
