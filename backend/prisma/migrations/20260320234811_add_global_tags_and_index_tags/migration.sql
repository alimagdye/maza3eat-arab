/*
  Warnings:

  - The primary key for the `PostTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `normalizedName` on the `PostTag` table. All the data in the column will be lost.
  - Added the required column `tagId` to the `PostTag` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PostTag_normalizedName_idx";

-- AlterTable
ALTER TABLE "PostTag" DROP CONSTRAINT "PostTag_pkey",
DROP COLUMN "normalizedName",
ADD COLUMN     "tagId" TEXT NOT NULL,
ADD CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId", "tagId");

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_normalizedName_key" ON "Tag"("normalizedName");

-- CreateIndex
CREATE INDEX "PostTag_tagId_postId_idx" ON "PostTag"("tagId", "postId");

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
