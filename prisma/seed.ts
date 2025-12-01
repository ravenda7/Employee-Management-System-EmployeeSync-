// prisma/seed.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

// --- 1. Create adapter (same style as lib/db.ts) ---
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// --- 2. PrismaClient MUST receive an options object ---
const prisma = new PrismaClient({
  adapter,
  // optional but fine to keep logs minimal
  log: ["error"],
});

async function main() {
  console.log("🌱 Seeding SUPER ADMIN...");

  // Optional: clear any existing SUPER_ADMIN
  await prisma.employee.deleteMany({
    where: {
      role: "SUPER_ADMIN",
    },
  });

  // Create Super Admin
  const superAdmin = await prisma.employee.create({
    data: {
      id: "super-admin-1",
      email: "super@employeesync.com",
      name: "Super Admin",
      hashedPassword: await bcrypt.hash("superadmin123", 10),
      role: "SUPER_ADMIN",
      permissions: [
        "view",
        "create",
        "update",
        "delete",
        "markPaid",
        "approve",
        "reject",
      ],
      // let createdAt/updatedAt default if you have @default(now())
      // add them if your schema requires explicit values:
      // createdAt: new Date(),
      // updatedAt: new Date(),
    },
  });

  console.log("✅ SUPER ADMIN CREATED:", superAdmin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🌱 Seeding finished.");
  })
  .catch(async (err) => {
    console.error("❌ Seeding error:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
