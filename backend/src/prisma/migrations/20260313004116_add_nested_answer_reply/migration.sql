/*
  Warnings:

  - Added the required column `titleNormalized` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ReportTargetType" ADD VALUE 'ANSWER_REPLY';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "titleNormalized" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "path" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "answerReplyId" TEXT;

-- CreateTable
CREATE TABLE "AnswerReply" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentReplyId" TEXT,
    "content" TEXT NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnswerReply_answerId_idx" ON "AnswerReply"("answerId");

-- CreateIndex
CREATE INDEX "AnswerReply_parentReplyId_idx" ON "AnswerReply"("parentReplyId");

-- CreateIndex
CREATE INDEX "AnswerReply_authorId_idx" ON "AnswerReply"("authorId");

-- AddForeignKey
ALTER TABLE "AnswerReply" ADD CONSTRAINT "AnswerReply_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReply" ADD CONSTRAINT "AnswerReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReply" ADD CONSTRAINT "AnswerReply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "AnswerReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_answerReplyId_fkey" FOREIGN KEY ("answerReplyId") REFERENCES "AnswerReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
