/*
  Warnings:

  - You are about to drop the column `whitelistedIps` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "whitelistedIps";

-- CreateTable
CREATE TABLE "WhitelistedIpRange" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "minIpRange" TEXT NOT NULL,
    "maxIpRange" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhitelistedIpRange_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WhitelistedIpRange" ADD CONSTRAINT "WhitelistedIpRange_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
