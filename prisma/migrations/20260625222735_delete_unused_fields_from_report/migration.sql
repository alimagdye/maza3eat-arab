/*
  Warnings:

  - You are about to drop the column `reviewedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedById` on the `Report` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reviewedById_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reviewedAt",
DROP COLUMN "reviewedById";
