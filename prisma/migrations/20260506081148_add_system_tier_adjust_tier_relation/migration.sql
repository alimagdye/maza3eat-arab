/*
  Warnings:

  - A unique constraint covering the columns `[badgeColor]` on the table `Tier` will be added. If there are existing duplicate values, this will fail.
  - Made the column `description` on table `Tier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `tierId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_tierId_fkey";

-- AlterTable
ALTER TABLE "Tier" ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "tierId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Tier_badgeColor_key" ON "Tier"("badgeColor");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "Tier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
