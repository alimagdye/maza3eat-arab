/*
  Warnings:

  - You are about to drop the column `respondedAt` on the `ContactRequest` table. All the data in the column will be lost.
  - You are about to drop the column `sharedEmail` on the `ContactRequest` table. All the data in the column will be lost.
  - You are about to drop the column `sharedFacebook` on the `ContactRequest` table. All the data in the column will be lost.
  - You are about to drop the column `sharedInstagram` on the `ContactRequest` table. All the data in the column will be lost.
  - You are about to drop the column `sharedPhone` on the `ContactRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requesterId,receiverId]` on the table `ContactRequest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reason` to the `ContactRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContactMethodType" AS ENUM ('EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM');

-- DropIndex
DROP INDEX "ContactRequest_receiverId_idx";

-- DropIndex
DROP INDEX "ContactRequest_requesterId_idx";

-- AlterTable
ALTER TABLE "ContactRequest" DROP COLUMN "respondedAt",
DROP COLUMN "sharedEmail",
DROP COLUMN "sharedFacebook",
DROP COLUMN "sharedInstagram",
DROP COLUMN "sharedPhone",
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "contactRequestId" TEXT;

-- CreateTable
CREATE TABLE "ContactMethod" (
    "id" TEXT NOT NULL,
    "contactRequestId" TEXT NOT NULL,
    "type" "ContactMethodType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContactMethod_contactRequestId_key" ON "ContactMethod"("contactRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactRequest_requesterId_receiverId_key" ON "ContactRequest"("requesterId", "receiverId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMethod" ADD CONSTRAINT "ContactMethod_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
