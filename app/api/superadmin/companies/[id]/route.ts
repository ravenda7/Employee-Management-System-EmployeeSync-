// app/api/superadmin/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  adminEmail: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;

  const company = await db.company.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          employees: true,
          whitelistedIpRanges: true,
          departments: true,
          attendances: true,
          leaves: true,
          shifts: true,
        },
      },
      employees: {
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!company) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const data = {
    id: company.id,
    name: company.name,
    adminEmail: company.adminEmail,
    createdAt: company.createdAt,
    isActive: (company as any).isActive ?? true,
    deactivatedAt: (company as any).deactivatedAt ?? null,
    counts: {
      employees: company._count.employees,
      ipRanges: company._count.whitelistedIpRanges,
      departments: company._count.departments,
      attendances: company._count.attendances,
      leaves: company._count.leaves,
      shifts: company._count.shifts,
    },
    recentEmployees: company.employees,
  };

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const json = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, adminEmail, isActive } = parsed.data;

  const data: any = {};
  if (typeof name === "string") data.name = name;
  if (typeof adminEmail === "string") data.adminEmail = adminEmail;
  if (typeof isActive === "boolean") {
    data.isActive = isActive;
    data.deactivatedAt = isActive ? null : new Date();
  }

  const updated = await db.company.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}
