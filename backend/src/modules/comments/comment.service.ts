import { prisma } from '../../lib/client.js';
import NotificationService from '../notifications/notification.service.js';

class CommentService {
    private notificationService = NotificationService;
    async createComment(postId: string, userId: string, content: string) {
        const result = await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({
                where: { id: postId },
                select: { id: true, status: true, authorId: true},
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

            return { comment, post };
        });
        await this.notificationService.createCommentOrAnswerNotification({
            recipientId: result.post.authorId,
            actorId: userId,
            postId,
            commentId: result.comment.id,
            type: 'COMMENT',
        });
        return result.comment;
    }

    async getCommentsByPostId(
        postId: string,
        cursor: string | null = null,
        userId: string | null = null,
    ) {
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

            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],

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
                ...(userId && {
                    likes: {
                        where: { userId },
                        select: { userId: true },
                    },
                }),
            },
        });

        const nextCursor =
            comments.length === pageSize
                ? comments[comments.length - 1].id
                : null;

        const result = comments.map((comment) => {
            const likedByMe =
                userId && comment.likes ? comment.likes.length > 0 : false;

            return {
                id: comment.id,
                postId: comment.postId,
                authorId: comment.authorId,
                content: comment.content,

                likesCount: comment.likesCount,
                repliesCount: comment.repliesCount,
                createdAt: comment.createdAt,

                author: {
                    id: comment.author.id,
                    name: comment.author.name,
                    avatar: comment.author.avatar,
                    tier: comment.author.tier,
                },

                likedByMe,
            };
        });

        return {
            comments: result,
            nextCursor,
            hasMore: comments.length === pageSize,
        };
    }

    async deleteCommentById(commentId: string, postId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findUnique({
                where: { id: commentId },
                select: {
                    id: true,
                    postId: true,
                    authorId: true,
                    repliesCount: true,
                },
            });

            if (!comment || comment.postId !== postId) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            if (comment.authorId !== userId) {
                console.log(comment.authorId, userId);
                throw new Error('UNAUTHORIZED');
            }

            await tx.comment.delete({
                where: { id: commentId },
            });

            await tx.post.update({
                where: { id: postId },
                data: {
                    commentsCount: {
                        decrement: 1 + comment.repliesCount,
                    },
                },
            });
        });
    }
}

export default new CommentService();
