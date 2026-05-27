-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'POST_APPROVAL';
ALTER TYPE "NotificationType" ADD VALUE 'QUESTION_APPROVAL';

-- DropIndex
DROP INDEX "Answer_questionId_totalVoteValue_id_idx";

-- DropIndex
DROP INDEX "Comment_postId_createdAt_id_idx";

-- DropIndex
DROP INDEX "Post_authorId_createdAt_id_idx";

-- DropIndex
DROP INDEX "Post_status_commentsCount_id_idx";

-- DropIndex
DROP INDEX "Post_status_createdAt_id_idx";

-- DropIndex
DROP INDEX "Question_authorId_createdAt_id_idx";

-- DropIndex
DROP INDEX "Question_status_answersCount_id_idx";

-- DropIndex
DROP INDEX "Question_status_createdAt_id_idx";

-- CreateTable
CREATE TABLE "PostLikeNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PostLikeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostLikeNotification_notificationId_key" ON "PostLikeNotification"("notificationId");

-- CreateIndex
CREATE INDEX "Answer_questionId_totalVoteValue_id_idx" ON "Answer"("questionId", "totalVoteValue" DESC, "id");

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_id_idx" ON "Comment"("postId", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Post_status_createdAt_id_idx" ON "Post"("status", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Post_status_commentsCount_id_idx" ON "Post"("status", "commentsCount" DESC, "id");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_id_idx" ON "Post"("authorId", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Question_status_createdAt_id_idx" ON "Question"("status", "createdAt" DESC, "id");

-- CreateIndex
CREATE INDEX "Question_status_answersCount_id_idx" ON "Question"("status", "answersCount" DESC, "id");

-- CreateIndex
CREATE INDEX "Question_authorId_createdAt_id_idx" ON "Question"("authorId", "createdAt" DESC, "id");

-- AddForeignKey
ALTER TABLE "PostLikeNotification" ADD CONSTRAINT "PostLikeNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostLikeNotification" ADD CONSTRAINT "PostLikeNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
