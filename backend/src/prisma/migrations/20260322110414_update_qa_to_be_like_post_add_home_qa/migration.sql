/*
  Warnings:

  - You are about to drop the column `isDeleted` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Question` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[answerId,path]` on the table `AnswerReply` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Answer_questionId_idx";

-- DropIndex
DROP INDEX "Question_authorId_idx";

-- DropIndex
DROP INDEX "Question_status_idx";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "isDeleted",
ADD COLUMN     "repliesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalVoteValue" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AnswerReply" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "isDeleted",
ADD COLUMN     "answersCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "HomeQuestion" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "scope" "HomeScope" NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "HomeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionTag" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "QuestionTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionLike" (
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionLike_pkey" PRIMARY KEY ("userId","questionId")
);

-- CreateTable
CREATE TABLE "AnswerReplyLike" (
    "userId" TEXT NOT NULL,
    "answerReplyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerReplyLike_pkey" PRIMARY KEY ("userId","answerReplyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeQuestion_scope_position_key" ON "HomeQuestion"("scope", "position");

-- CreateIndex
CREATE UNIQUE INDEX "HomeQuestion_scope_questionId_key" ON "HomeQuestion"("scope", "questionId");

-- CreateIndex
CREATE INDEX "QuestionTag_tagId_questionId_idx" ON "QuestionTag"("tagId", "questionId");

-- CreateIndex
CREATE INDEX "QuestionLike_questionId_idx" ON "QuestionLike"("questionId");

-- CreateIndex
CREATE INDEX "AnswerReplyLike_answerReplyId_idx" ON "AnswerReplyLike"("answerReplyId");

-- CreateIndex
CREATE INDEX "Answer_questionId_totalVoteValue_id_idx" ON "Answer"("questionId", "totalVoteValue", "id");

-- CreateIndex
CREATE INDEX "AnswerReply_answerId_path_idx" ON "AnswerReply"("answerId", "path");

-- CreateIndex
CREATE INDEX "AnswerReply_path_idx" ON "AnswerReply"("path");

-- CreateIndex
CREATE INDEX "AnswerReply_answerId_createdAt_id_idx" ON "AnswerReply"("answerId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AnswerReply_parentReplyId_createdAt_id_idx" ON "AnswerReply"("parentReplyId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerReply_answerId_path_key" ON "AnswerReply"("answerId", "path");

-- CreateIndex
CREATE INDEX "AnswerVote_answerId_idx" ON "AnswerVote"("answerId");

-- CreateIndex
CREATE INDEX "Question_status_createdAt_id_idx" ON "Question"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Question_status_answersCount_id_idx" ON "Question"("status", "answersCount", "id");

-- CreateIndex
CREATE INDEX "Question_authorId_createdAt_id_idx" ON "Question"("authorId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Question_titleNormalized_idx" ON "Question"("titleNormalized");

-- AddForeignKey
ALTER TABLE "HomeQuestion" ADD CONSTRAINT "HomeQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionTag" ADD CONSTRAINT "QuestionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLike" ADD CONSTRAINT "QuestionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLike" ADD CONSTRAINT "QuestionLike_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyLike" ADD CONSTRAINT "AnswerReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyLike" ADD CONSTRAINT "AnswerReplyLike_answerReplyId_fkey" FOREIGN KEY ("answerReplyId") REFERENCES "AnswerReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
