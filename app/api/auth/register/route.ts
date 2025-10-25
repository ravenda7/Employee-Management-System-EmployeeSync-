// app/api/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import { db } from '@/lib/db';

const SALT_ROUNDS = 10;

// Define the schema for validation (matches the client-side Zod schema)
const registerSchema = z.object({
    companyEmail: z.email(),
    companyName: z.string().min(1),
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: 'Invalid registration data', errors: validation.error.issues }, { status: 400 });
        }

        const { companyName, companyEmail, name, email, password } = validation.data;

        // 1. Check if the company already exists by adminEmail
        const existingCompany = await db.company.findUnique({
            where: { adminEmail: companyEmail },
        });

        if (existingCompany) {
            return NextResponse.json({ message: 'A company with this admin email already exists.' }, { status: 409 });
        }
        
        // 2. Check if the admin user already exists by email
        const existingAdmin = await db.employee.findUnique({
            where: { email: email },
        });

        if (existingAdmin) {
            return NextResponse.json({ message: 'An employee with this email already exists.' }, { status: 409 });
        }

        const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

        // 3. Create Company and Admin in a transaction
        const [newCompany, newAdmin] = await db.$transaction([
            // Create the Company
            db.company.create({
                data: {
                    name: companyName,
                    adminEmail: companyEmail,
                },
            }),
            // Create the Company Admin
            db.employee.create({
                data: {
                    company: {
                        connect: { adminEmail: companyEmail } // Use the created company's unique field
                    },
                    email: email,
                    name: name,
                    hashedPassword: hashedPassword,
                    role: 'COMPANY_ADMIN',
                    permissions: ['view', 'create', 'update', 'delete', 'markPaid', 'approve', 'reject'],
                    baseSalary: 0,
                    hourlyRate: 0,
                    joinDate: new Date(),
                },
            }),
        ]);
        
        // Return a success message
        return NextResponse.json({ 
            message: 'Company and Admin created successfully', 
            companyId: newCompany.id,
            userId: newAdmin.id
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}