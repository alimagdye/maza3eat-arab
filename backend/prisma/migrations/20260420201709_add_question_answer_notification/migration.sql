-- CreateTable
CREATE TABLE "QuestionAnswerNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "lastAnswerId" TEXT,

    CONSTRAINT "QuestionAnswerNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAnswerNotification_notificationId_key" ON "QuestionAnswerNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "QuestionAnswerNotification" ADD CONSTRAINT "QuestionAnswerNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnswerNotification" ADD CONSTRAINT "QuestionAnswerNotification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAnswerNotification" ADD CONSTRAINT "QuestionAnswerNotification_lastAnswerId_fkey" FOREIGN KEY ("lastAnswerId") REFERENCES "Answer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
