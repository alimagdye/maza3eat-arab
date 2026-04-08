/*
  Warnings:

  - Added the required column `height` to the `PostImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalName` to the `PostImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicId` to the `PostImage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `width` to the `PostImage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostImage" ADD COLUMN     "height" INTEGER NOT NULL,
ADD COLUMN     "originalName" TEXT NOT NULL,
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "width" INTEGER NOT NULL;
