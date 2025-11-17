-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "unverifiedDeviceIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
