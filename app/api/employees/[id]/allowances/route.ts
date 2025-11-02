import { db } from "@/lib/db";
import { NextResponse } from "next/server";

interface AllowanceAPI {
  params: Promise<{
    id: string;
  }>;
}


export async function PATCH(req: Request, context: AllowanceAPI) {
  try {
    const params = await context.params;
    const employeeId = params.id;

    const { allowances } = await req.json();

    const updated = await db.employee.update({
      where: { id: employeeId},
      data: { allowances },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update allowances" }, { status: 500 });
  }
}
