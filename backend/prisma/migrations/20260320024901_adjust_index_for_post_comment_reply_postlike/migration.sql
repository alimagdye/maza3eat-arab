-- DropIndex
DROP INDEX "Comment_createdAt_idx";

-- DropIndex
DROP INDEX "Comment_postId_idx";

-- DropIndex
DROP INDEX "Post_authorId_idx";

-- DropIndex
DROP INDEX "Post_commentsCount_idx";

-- DropIndex
DROP INDEX "Post_createdAt_idx";

-- DropIndex
DROP INDEX "Post_likesCount_idx";

-- DropIndex
DROP INDEX "Post_status_idx";

-- DropIndex
DROP INDEX "PostImage_postId_idx";

-- CreateIndex
CREATE INDEX "Comment_postId_createdAt_id_idx" ON "Comment"("postId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Post_status_createdAt_id_idx" ON "Post"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Post_status_commentsCount_id_idx" ON "Post"("status", "commentsCount", "id");

-- CreateIndex
CREATE INDEX "Post_authorId_createdAt_id_idx" ON "Post"("authorId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "PostImage_postId_createdAt_idx" ON "PostImage"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "PostLike_postId_idx" ON "PostLike"("postId");

-- CreateIndex
CREATE INDEX "Reply_path_idx" ON "Reply"("path");

-- CreateIndex
CREATE INDEX "Reply_commentId_createdAt_id_idx" ON "Reply"("commentId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_createdAt_id_idx" ON "Reply"("parentReplyId", "createdAt", "id");
