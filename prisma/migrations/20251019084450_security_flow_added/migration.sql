/*
  Warnings:

  - Added the required column `deviceId` to the `Attendance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `loggedIp` to the `Attendance` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('IN_OFFICE', 'REMOTE', 'MANUAL_ADJUSTMENT');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "deviceId" TEXT NOT NULL,
ADD COLUMN     "ipCheckDetails" JSONB,
ADD COLUMN     "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loggedIp" TEXT NOT NULL,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'REMOTE';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "whitelistedIps" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "approvedDeviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
