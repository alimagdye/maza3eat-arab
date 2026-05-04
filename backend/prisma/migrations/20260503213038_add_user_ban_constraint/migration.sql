/*
  Warnings:

  - Made the column `bannedById` on table `Ban` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Ban" DROP CONSTRAINT "Ban_bannedById_fkey";

-- AlterTable
ALTER TABLE "Ban" ALTER COLUMN "bannedById" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Ban_bannedById_idx" ON "Ban"("bannedById");

-- AddForeignKey
ALTER TABLE "Ban" ADD CONSTRAINT "Ban_bannedById_fkey" FOREIGN KEY ("bannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
