/*
  Warnings:

  - A unique constraint covering the columns `[imageUrl]` on the table `PostImage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `PostImage` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PostImage_imageUrl_key" ON "PostImage"("imageUrl");

-- CreateIndex
CREATE UNIQUE INDEX "PostImage_publicId_key" ON "PostImage"("publicId");
