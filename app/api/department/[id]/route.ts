import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1),
  companyId: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  const { id } = await context.params  

  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const department = await db.department.update({
      where: { id: id },
      data,
    });

    return NextResponse.json(department);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update department" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params 
  try {
    await db.department.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: "Department deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete department" }, { status: 500 });
  }
}
