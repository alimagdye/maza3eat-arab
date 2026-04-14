/*
  Warnings:

  - You are about to drop the column `message` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedEntityId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `relatedEntityType` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `lastActorId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'ANSWER_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'REPLY_REPLY_POST';
ALTER TYPE "NotificationType" ADD VALUE 'REPLY_REPLY_QUESTION';

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropIndex
DROP INDEX "Notification_type_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "message",
DROP COLUMN "relatedEntityId",
DROP COLUMN "relatedEntityType",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "lastActorId" TEXT NOT NULL,
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "AnswerReplyNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,

    CONSTRAINT "AnswerReplyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnswerReplyNotification_notificationId_key" ON "AnswerReplyNotification"("notificationId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_id_idx" ON "Notification"("recipientId", "createdAt", "id");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_lastActorId_fkey" FOREIGN KEY ("lastActorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyNotification" ADD CONSTRAINT "AnswerReplyNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyNotification" ADD CONSTRAINT "AnswerReplyNotification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyNotification" ADD CONSTRAINT "AnswerReplyNotification_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyNotification" ADD CONSTRAINT "AnswerReplyNotification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "AnswerReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
