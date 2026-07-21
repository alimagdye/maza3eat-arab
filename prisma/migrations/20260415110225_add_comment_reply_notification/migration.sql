-- CreateTable
CREATE TABLE "CommentReplyNotification" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,

    CONSTRAINT "CommentReplyNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentReplyNotification_notificationId_key" ON "CommentReplyNotification"("notificationId");

-- AddForeignKey
ALTER TABLE "CommentReplyNotification" ADD CONSTRAINT "CommentReplyNotification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyNotification" ADD CONSTRAINT "CommentReplyNotification_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyNotification" ADD CONSTRAINT "CommentReplyNotification_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReplyNotification" ADD CONSTRAINT "CommentReplyNotification_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
