-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "checkInDelayMinutes" INTEGER,
ADD COLUMN     "earlyCheckoutMinutes" INTEGER,
ADD COLUMN     "scheduledEndTime" TIMESTAMP(3),
ADD COLUMN     "scheduledStartTime" TIMESTAMP(3),
ADD COLUMN     "shiftId" TEXT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
