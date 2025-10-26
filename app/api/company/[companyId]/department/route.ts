import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

interface DepartContext {
  params: Promise<{ companyId: string }>;
}

const departmentSchema = z.object({
  name: z.string().min(1),
});

// POST - Create a department
export async function POST(req: NextRequest, context: DepartContext) {
    try {
        const params = await context.params;
        const companyId = params.companyId;

        const body = await req.json();
        const data = departmentSchema.parse(body);

        const departmentName = data.name.trim();

        // 2. Security/Existence Check
        const company = await db.company.findUnique({ where: { id: companyId } });
        if (!company) {
        return NextResponse.json({ error: "Company not found." }, { status: 404 });
        }

        // 3. Uniqueness Check (Scoped by companyId)
        const existing = await db.department.findFirst({
        where: {
            companyId: companyId,
            name: {
            equals: departmentName,
            mode: "insensitive",
            },
        },
        });

        if (existing) {
        return NextResponse.json(
            { error: `Department '${departmentName}' already exists in this company.` },
            { status: 400 }
        );
        }

        const department = await db.department.create({
        data: {
            name: departmentName,
            company: { connect: { id: companyId } }, 
        },
        });
        return NextResponse.json(department, { status: 201 }); 

    } catch (error) {
        console.error('Error adding Department:', error);
        return NextResponse.json({ 
            message: "An unexpected error occurred while adding the Department." 
        }, { status: 500 });
    }
}


// GET - List departments with pagination and search
export async function GET(req: NextRequest, context: DepartContext) {
    try {
        const params = await context.params;
        const companyId = params.companyId;

        const { searchParams } = new URL(req.url);

        // Optional: Check if the company exists first
        const company = await db.company.findUnique({ where: { id: companyId } });
        if (!company) {
            return NextResponse.json({ message: "Company not found." }, { status: 404 });
        }

        // Pagination and Search Params
        const search = searchParams.get("search") || "";
        // Ensure page/limit are safe integers
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));

        const where = {
        name: { contains: search, mode: "insensitive" as const },
        companyId: companyId, // Filter departments by the company ID from the URL
        };

        const [departments, total] = await Promise.all([
        db.department.findMany({
            where,
            // Include company info only if needed, can increase payload size
            // include: { company: true }, 
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: "desc" },
        }),
        db.department.count({ where }),
        ]);
        
        // Calculate total pages for frontend convenience
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({ 
            data: departments, 
            total,
            page,
            limit,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({
            message: "An unexpected error occurred while fetching departments."
        }, { status: 500 });
    }
}