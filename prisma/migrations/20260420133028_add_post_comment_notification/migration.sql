/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Notification_recipientId_createdAt_id_idx";

-- DropIndex
DROP INDEX "Notification_recipientId_createdAt_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "updatedAt",
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "numberOfActors" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "NotificationActor" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,

    CONSTRAINT "NotificationActor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostCommentNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "lastCommentId" TEXT NOT NULL,

    CONSTRAINT "PostCommentNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationActor_notificationId_actorId_key" ON "NotificationActor"("notificationId", "actorId");

-- CreateIndex
CREATE UNIQUE INDEX "PostCommentNotification_notificationId_key" ON "PostCommentNotification"("notificationId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_lastActivityAt_idx" ON "Notification"("recipientId", "lastActivityAt" DESC);

-- CreateIndex
CREATE INDEX "Notification_recipientId_groupKey_idx" ON "Notification"("recipientId", "groupKey");

-- CreateIndex
CREATE INDEX "Notification_recipientId_lastActivityAt_id_idx" ON "Notification"("recipientId", "lastActivityAt", "id");

-- AddForeignKey
ALTER TABLE "NotificationActor" ADD CONSTRAINT "NotificationActor_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationActor" ADD CONSTRAINT "NotificationActor_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentNotification" ADD CONSTRAINT "PostCommentNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentNotification" ADD CONSTRAINT "PostCommentNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostCommentNotification" ADD CONSTRAINT "PostCommentNotification_lastCommentId_fkey" FOREIGN KEY ("lastCommentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
