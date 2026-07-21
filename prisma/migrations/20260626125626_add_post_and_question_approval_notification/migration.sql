-- CreateTable
CREATE TABLE "PostApprovalNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "PostApprovalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionApprovalNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "QuestionApprovalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostApprovalNotification_notificationId_key" ON "PostApprovalNotification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionApprovalNotification_notificationId_key" ON "QuestionApprovalNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "PostApprovalNotification" ADD CONSTRAINT "PostApprovalNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostApprovalNotification" ADD CONSTRAINT "PostApprovalNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionApprovalNotification" ADD CONSTRAINT "QuestionApprovalNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionApprovalNotification" ADD CONSTRAINT "QuestionApprovalNotification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
