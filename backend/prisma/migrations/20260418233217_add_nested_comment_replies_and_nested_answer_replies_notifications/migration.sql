-- CreateTable
CREATE TABLE "CommentReplyReplyNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "parentReplyId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,

    CONSTRAINT "CommentReplyReplyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerReplyReplyNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "parentReplyId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,

    CONSTRAINT "AnswerReplyReplyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentReplyReplyNotification_notificationId_key" ON "CommentReplyReplyNotification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerReplyReplyNotification_notificationId_key" ON "AnswerReplyReplyNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "CommentReplyReplyNotification" ADD CONSTRAINT "CommentReplyReplyNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyReplyNotification" ADD CONSTRAINT "CommentReplyReplyNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyReplyNotification" ADD CONSTRAINT "CommentReplyReplyNotification_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyReplyNotification" ADD CONSTRAINT "CommentReplyReplyNotification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyReplyNotification" ADD CONSTRAINT "AnswerReplyReplyNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyReplyNotification" ADD CONSTRAINT "AnswerReplyReplyNotification_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyReplyNotification" ADD CONSTRAINT "AnswerReplyReplyNotification_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "AnswerReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerReplyReplyNotification" ADD CONSTRAINT "AnswerReplyReplyNotification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "AnswerReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
