/*
  Warnings:

  - The primary key for the `PostTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `titleNormalized` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `normalizedName` to the `PostTag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "titleNormalized" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PostTag" DROP CONSTRAINT "PostTag_pkey",
ADD COLUMN     "normalizedName" TEXT NOT NULL,
ADD CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId", "normalizedName");

-- CreateIndex
CREATE INDEX "Post_titleNormalized_idx" ON "Post"("titleNormalized");

-- CreateIndex
CREATE INDEX "PostTag_normalizedName_idx" ON "PostTag"("normalizedName");
