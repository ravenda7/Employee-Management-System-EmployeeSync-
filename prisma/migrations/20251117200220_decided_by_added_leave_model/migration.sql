/*
  Warnings:

  - You are about to alter the column `duration` on the `Leave` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropIndex
DROP INDEX "Leave_companyId_empId_idx";

-- DropIndex
DROP INDEX "Leave_companyId_leaveTypeId_idx";

-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "decidedById" TEXT,
ADD COLUMN     "decisionNote" TEXT,
ALTER COLUMN "isPaid" DROP DEFAULT,
ALTER COLUMN "duration" SET DATA TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
