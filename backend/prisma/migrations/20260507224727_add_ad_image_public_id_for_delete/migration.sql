/*
  Warnings:

  - You are about to drop the column `imageName` on the `Ad` table. All the data in the column will be lost.
  - You are about to drop the column `link` on the `Ad` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imageUrl]` on the table `Ad` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[imagePublicId]` on the table `Ad` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addedById` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageHeight` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageOriginalName` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imagePublicId` to the `Ad` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageWidth` to the `Ad` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ad" DROP COLUMN "imageName",
DROP COLUMN "link",
ADD COLUMN     "addedById" TEXT NOT NULL,
ADD COLUMN     "imageHeight" INTEGER NOT NULL,
ADD COLUMN     "imageOriginalName" TEXT NOT NULL,
ADD COLUMN     "imagePublicId" TEXT NOT NULL,
ADD COLUMN     "imageWidth" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ad_imageUrl_key" ON "Ad"("imageUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_imagePublicId_key" ON "Ad"("imagePublicId");

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
