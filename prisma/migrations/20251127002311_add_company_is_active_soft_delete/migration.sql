/*
  Warnings:

  - You are about to drop the column `deactivatedAt` on the `Department` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Department` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Department" DROP COLUMN "deactivatedAt",
DROP COLUMN "isActive";
