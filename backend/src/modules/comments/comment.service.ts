import { prisma } from '../../prisma/client.js';

class CommentService {
    async createComment(postId: string, userId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({
                where: { id: postId },
            });

            if (!post || post.status !== 'APPROVED') {
                throw new Error('POST_NOT_FOUND');
            }

            const comment = await tx.comment.create({
                data: {
                    content,
                    postId,
                    authorId: userId,
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                            tier: {
                                select: {
                                    name: true,
                                    badgeColor: true,
                                },
                            },
                        },
                    },
                },
            });

            await tx.post.update({
                where: { id: postId },
                data: {
                    commentsCount: {
                        increment: 1,
                    },
                },
            });

            return comment;
        });
    }

    async getCommentsByPostId(postId: string, cursor?: string) {
        const pageSize = 5;

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                status: 'APPROVED',
            },
        });

        if (!post) {
            throw new Error('POST_NOT_FOUND');
        }

        const comments = await prisma.comment.findMany({
            where: { postId },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: {
                createdAt: 'desc',
            },

            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
            },
        });

        const nextCursor =
            comments.length === pageSize
                ? comments[comments.length - 1].id
                : null;

        return {
            comments,
            nextCursor,
            hasMore: comments.length === pageSize,
        };
    }

    async deleteCommentById(commentId: string, postId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findUnique({
                where: { id: commentId },
            });

            if (!comment || comment.postId !== postId) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            if (comment.authorId !== userId) {
                throw new Error('UNAUTHORIZED');
            }

            await tx.comment.delete({
                where: { id: commentId },
            });

            await tx.post.update({
                where: { id: postId },
                data: {
                    commentsCount: {
                        decrement: 1,
                    },
                },
            });
        });
    }
}

export default new CommentService();
