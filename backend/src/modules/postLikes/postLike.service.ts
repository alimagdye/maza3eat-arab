import { prisma } from '../../lib/client.js';

class LikeService {
    async likePost(userId: string, postId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.postLike.create({
                data: { userId, postId },
            });

            await tx.post.update({
                where: { id: postId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikePost(userId: string, postId: string) {
        await prisma.$transaction(async (tx) => {
            // check post exists
            const post = await tx.post.findUnique({
                where: { id: postId },
                select: { id: true },
            });

            if (!post) {
                throw new Error('POST_NOT_FOUND');
            }

            const result = await tx.postLike.deleteMany({
                where: { userId, postId },
            });

            if (result.count > 0) {
                await tx.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }

    async likeComment(userId: string, commentId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.commentLike.create({
                data: { userId, commentId },
            });

            await tx.comment.update({
                where: { id: commentId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikeComment(userId: string, commentId: string) {
        await prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findUnique({
                where: { id: commentId },
                select: { id: true },
            });

            if (!comment) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            const result = await tx.commentLike.deleteMany({
                where: { userId, commentId },
            });

            if (result.count > 0) {
                await tx.comment.update({
                    where: { id: commentId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }

    async likeReply(userId: string, replyId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.replyLike.create({
                data: { userId, replyId },
            });

            await tx.reply.update({
                where: { id: replyId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikeReply(userId: string, replyId: string) {
        await prisma.$transaction(async (tx) => {
            // check reply exists
            const reply = await tx.reply.findUnique({
                where: { id: replyId },
                select: { id: true },
            });

            if (!reply) {
                throw new Error('REPLY_NOT_FOUND');
            }

            const result = await tx.replyLike.deleteMany({
                where: { userId, replyId },
            });

            if (result.count > 0) {
                await tx.reply.update({
                    where: { id: replyId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }
}

export default new LikeService();
