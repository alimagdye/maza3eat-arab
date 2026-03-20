/*
  Warnings:

  - A unique constraint covering the columns `[commentId,path]` on the table `Reply` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Reply_commentId_path_idx" ON "Reply"("commentId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "Reply_commentId_path_key" ON "Reply"("commentId", "path");
