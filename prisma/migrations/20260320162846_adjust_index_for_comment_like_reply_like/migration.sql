-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE INDEX "ReplyLike_replyId_idx" ON "ReplyLike"("replyId");
