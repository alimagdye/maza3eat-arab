-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'QUESTION_LIKE';

-- CreateTable
CREATE TABLE "QuestionLikeNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "QuestionLikeNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionLikeNotification_notificationId_key" ON "QuestionLikeNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "QuestionLikeNotification" ADD CONSTRAINT "QuestionLikeNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionLikeNotification" ADD CONSTRAINT "QuestionLikeNotification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
