
import { PrismaClient } from '@/lib/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  try {
    // Clear existing data (optional, for clean slate)
    await prisma.employee.deleteMany();
    await prisma.company.deleteMany();
    console.log('Cleared existing data');

    // Create Super Admin (no companyId)
    await prisma.employee.create({
      data: {
        id: 'super-admin-1',
        email: 'super@employeesync.com',
        name: 'Super Admin',
        hashedPassword: bcrypt.hashSync('superadmin123', 10),
        role: 'SUPER_ADMIN',
        permissions: ['view', 'create', 'update', 'delete', 'markPaid', 'approve', 'reject'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created Super Admin');

    // Create Sample Company
    const company = await prisma.company.create({
      data: {
        id: 'company-1',
        name: 'ABC Pvt Ltd',
        adminEmail: 'admin@abc.com',
        createdAt: new Date(),
      },
    });
    console.log('Created Company:', company.name);

    // Create Company Admin
    await prisma.employee.create({
      data: {
        id: 'company-admin-1',
        companyId: company.id,
        email: 'admin@abc.com',
        name: 'ABC Admin',
        hashedPassword: bcrypt.hashSync('admin123', 10),
        role: 'COMPANY_ADMIN',
        permissions: ['view', 'create', 'update', 'delete', 'markPaid', 'approve', 'reject'],
        baseSalary: 50000,
        hourlyRate: 50000 / 160,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created Company Admin');

    // Create HR
    await prisma.employee.create({
      data: {
        id: 'hr-1',
        companyId: company.id,
        email: 'hr@abc.com',
        name: 'HR Manager',
        hashedPassword: bcrypt.hashSync('hr123', 10),
        role: 'COMPANY_HR',
        permissions: ['view', 'update', 'markPaid', 'approve', 'reject'],
        department: 'HR',
        baseSalary: 40000,
        hourlyRate: 40000 / 160,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created HR');

    // Create Employee
    await prisma.employee.create({
      data: {
        id: 'employee-1',
        companyId: company.id,
        email: 'emp@abc.com',
        name: 'Test Employee',
        hashedPassword: bcrypt.hashSync('emp123', 10),
        role: 'EMPLOYEE',
        permissions: ['view', 'create'],
        department: 'IT',
        baseSalary: 30000,
        hourlyRate: 30000 / 160,
        joinDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('Created Employee');
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

main()
  .then(async () => {
    console.log('Seeding completed successfully');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seeding error:', error);
    await prisma.$disconnect();
    process.exit(1);
  });