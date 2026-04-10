/*
  Warnings:

  - Added the required column `amountPaid` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buttonText` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expireAt` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageName` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priority` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Ad` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AdPosition" AS ENUM ('TOP', 'MIDDLE', 'BOTTOM');

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "buttonText" TEXT NOT NULL,
ADD COLUMN     "expireAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "imageName" TEXT NOT NULL,
ADD COLUMN     "priority" INTEGER NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "HomeAd" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "position" "AdPosition" NOT NULL,

    CONSTRAINT "HomeAd_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeAd_adId_idx" ON "HomeAd"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "HomeAd_position_key" ON "HomeAd"("position");

-- CreateIndex
CREATE INDEX "Ad_isActive_expireAt_idx" ON "Ad"("isActive", "expireAt");

-- AddForeignKey
ALTER TABLE "HomeAd" ADD CONSTRAINT "HomeAd_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
