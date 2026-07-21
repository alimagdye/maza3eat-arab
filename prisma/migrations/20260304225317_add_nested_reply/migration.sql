/*
  Warnings:

  - The values [POST,QUESTION] on the enum `ReportTargetType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isDeleted` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `countryId` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `countryId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `isBanned` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isDeleted` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Country` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PostAd` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReportTargetType_new" AS ENUM ('COMMENT', 'REPLY', 'ANSWER');
ALTER TABLE "Report" ALTER COLUMN "targetType" TYPE "ReportTargetType_new" USING ("targetType"::text::"ReportTargetType_new");
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
ALTER TYPE "ReportTargetType_new" RENAME TO "ReportTargetType";
DROP TYPE "public"."ReportTargetType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_countryId_fkey";

-- DropForeignKey
ALTER TABLE "PostAd" DROP CONSTRAINT "PostAd_adId_fkey";

-- DropForeignKey
ALTER TABLE "PostAd" DROP CONSTRAINT "PostAd_postId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_countryId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_postId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_questionId_fkey";

-- DropIndex
DROP INDEX "User_isDeleted_isBanned_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "isDeleted",
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "city",
DROP COLUMN "countryId",
DROP COLUMN "isDeleted",
ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "countryId";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "replyId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isBanned",
DROP COLUMN "isDeleted";

-- DropTable
DROP TABLE "Country";

-- DropTable
DROP TABLE "PostAd";

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","name")
);

-- CreateTable
CREATE TABLE "Reply" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentReplyId" TEXT,
    "content" TEXT NOT NULL,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateTable
CREATE TABLE "ReplyLike" (
    "userId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReplyLike_pkey" PRIMARY KEY ("userId","replyId")
);

-- CreateIndex
CREATE INDEX "Reply_commentId_idx" ON "Reply"("commentId");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_idx" ON "Reply"("parentReplyId");

-- CreateIndex
CREATE INDEX "Reply_authorId_idx" ON "Reply"("authorId");

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyLike" ADD CONSTRAINT "ReplyLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyLike" ADD CONSTRAINT "ReplyLike_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
