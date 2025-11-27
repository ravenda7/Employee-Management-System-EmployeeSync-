// app/api/profile/[id]/password/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

const bodySchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const targetUserId = params.id;

  // 🔒 Only allow user to change their own password via this route
  if (user.id !== targetUserId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid body", errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const employee = await db.employee.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      hashedPassword: true,
    },
  });

  if (!employee) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  if (!employee.hashedPassword) {
    return NextResponse.json(
      { message: "Password change is not available for this account." },
      { status: 400 }
    );
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    employee.hashedPassword
  );

  if (!isMatch) {
    return NextResponse.json(
      { message: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await db.employee.update({
    where: { id: targetUserId },
    data: {
      hashedPassword: newHash,
    },
  });

  // (Optional in future: invalidate other sessions / force re-login)

  return NextResponse.json({
    message: "Password updated successfully",
  });
}
