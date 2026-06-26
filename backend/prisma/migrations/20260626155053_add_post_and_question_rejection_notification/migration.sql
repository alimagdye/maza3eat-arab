-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'POST_REJECTION';
ALTER TYPE "NotificationType" ADD VALUE 'QUESTION_REJECTION';

-- CreateTable
CREATE TABLE "PostRejectionNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postTitle" TEXT NOT NULL,
    "rejectionReason" TEXT NOT NULL,

    CONSTRAINT "PostRejectionNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionRejectionNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionTitle" TEXT NOT NULL,
    "rejectionReason" TEXT NOT NULL,

    CONSTRAINT "QuestionRejectionNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostRejectionNotification_notificationId_key" ON "PostRejectionNotification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionRejectionNotification_notificationId_key" ON "QuestionRejectionNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "PostRejectionNotification" ADD CONSTRAINT "PostRejectionNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionRejectionNotification" ADD CONSTRAINT "QuestionRejectionNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
