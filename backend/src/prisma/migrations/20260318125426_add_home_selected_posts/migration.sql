-- CreateEnum
CREATE TYPE "HomeScope" AS ENUM ('ADMIN', 'COMMUNITY');

-- CreateTable
CREATE TABLE "HomePost" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "scope" "HomeScope" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "HomePost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomePost_scope_position_key" ON "HomePost"("scope", "position");

-- CreateIndex
CREATE UNIQUE INDEX "HomePost_scope_postId_key" ON "HomePost"("scope", "postId");

-- CreateIndex
CREATE INDEX "Comment_createdAt_idx" ON "Comment"("createdAt");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_commentsCount_idx" ON "Post"("commentsCount");

-- CreateIndex
CREATE INDEX "Post_likesCount_idx" ON "Post"("likesCount");

-- AddForeignKey
ALTER TABLE "HomePost" ADD CONSTRAINT "HomePost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
