// app/api/company/[companyId]/leave-requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: NextRequest,
  { params }: { params: { companyId: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const companyId = params.companyId;

  // multi-tenant guard
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const sameCompany = user.companyId === companyId;

  if (!isSuperAdmin && !sameCompany) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // TODO: if you have permission strings, check them here (e.g. user.permissions.includes("LEAVE_MANAGE"))

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | null;

  const where: any = {
    companyId,
  };

  if (status) {
    where.status = status;
  }

  const leaves = await db.leave.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          department: {
            select: {
              name: true,
            },
          },
        },
      },
      leaveType: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      decidedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(leaves);
}
