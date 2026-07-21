/*
  Warnings:

  - The values [CONTACT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `postId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `Report` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[reporterId,commentId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reporterId,answerId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reporterId,replyId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reporterId,answerReplyId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reporterId,contactRequestId]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ANSWER_REPLY', 'COMMENT_REPLY', 'ANSWER_REPLY_REPLY', 'COMMENT_REPLY_REPLY', 'ADMIN', 'COMMENT', 'POST_LIKE', 'QUESTION_LIKE', 'ANSWER', 'REPORT', 'POST_APPROVAL', 'QUESTION_APPROVAL');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ReportTargetType" ADD VALUE 'CONTACT_REQUEST';

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_answerId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_answerReplyId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_commentId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_contactRequestId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_replyId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reporterId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "postId",
DROP COLUMN "questionId",
DROP COLUMN "targetId",
ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Report_commentId_idx" ON "Report"("commentId");

-- CreateIndex
CREATE INDEX "Report_answerId_idx" ON "Report"("answerId");

-- CreateIndex
CREATE INDEX "Report_replyId_idx" ON "Report"("replyId");

-- CreateIndex
CREATE INDEX "Report_answerReplyId_idx" ON "Report"("answerReplyId");

-- CreateIndex
CREATE INDEX "Report_contactRequestId_idx" ON "Report"("contactRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_commentId_key" ON "Report"("reporterId", "commentId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_answerId_key" ON "Report"("reporterId", "answerId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_replyId_key" ON "Report"("reporterId", "replyId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_answerReplyId_key" ON "Report"("reporterId", "answerReplyId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_reporterId_contactRequestId_key" ON "Report"("reporterId", "contactRequestId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_answerReplyId_fkey" FOREIGN KEY ("answerReplyId") REFERENCES "AnswerReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
