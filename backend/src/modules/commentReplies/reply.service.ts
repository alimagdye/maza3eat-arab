import { prisma } from '../../lib/client.js';
import replyUtils from './reply.utils.js';

class ReplyService {
    private MAX_DEPTH = 10;
    async replyToComment(commentId: string, userId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const comment = await tx.comment.findUnique({
                where: { id: commentId },
                select: {
                    id: true,
                    postId: true,
                },
            });

            if (!comment) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            const lastRootReply = await tx.reply.findFirst({
                where: {
                    commentId,
                    parentReplyId: null,
                },
                orderBy: {
                    path: 'desc',
                },
                select: {
                    path: true,
                },
            });

            let segment = '1';

            if (lastRootReply) {
                const parts = lastRootReply.path.split('.');
                const lastSegment = parts[parts.length - 1];

                segment = replyUtils.nextSegment(lastSegment);
            }

            const path = segment;

            const reply = await tx.reply.create({
                data: {
                    content,
                    commentId,
                    path,
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
                where: { id: comment.postId },
                data: {
                    commentsCount: {
                        increment: 1,
                    },
                },
            });

            await tx.comment.update({
                where: { id: commentId },
                data: {
                    repliesCount: {
                        increment: 1,
                    },
                },
            });

            return reply;
        });
    }

    async replyToReply(replyId: string, userId: string, content: string) {
        const MAX_DEPTH = this.MAX_DEPTH;

        return await prisma.$transaction(async (tx) => {
            const parent = await tx.reply.findUnique({
                where: { id: replyId },
                select: {
                    id: true,
                    depth: true,
                    path: true,
                    commentId: true,
                    comment: {
                        select: {
                            postId: true,
                        },
                    },
                },
            });

            if (!parent) {
                throw new Error('REPLY_NOT_FOUND');
            }

            if (!parent.comment) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            const depth = parent.depth + 1;

            if (depth > MAX_DEPTH) {
                throw new Error('MAX_DEPTH_REACHED');
            }

            const lastChild = await tx.reply.findFirst({
                where: {
                    parentReplyId: replyId,
                },
                orderBy: {
                    path: 'desc',
                },
                select: {
                    path: true,
                },
            });

            let segment = '1';

            if (lastChild) {
                const parts = lastChild.path.split('.');
                const lastSegment = parts[parts.length - 1];

                segment = replyUtils.nextSegment(lastSegment);
            }

            const path = parent.path + '.' + segment;

            const reply = await tx.reply.create({
                data: {
                    content,
                    commentId: parent.commentId,
                    parentReplyId: replyId,
                    depth,
                    path,
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
                where: { id: parent.comment.postId },
                data: {
                    commentsCount: {
                        increment: 1,
                    },
                },
            });

            await tx.comment.update({
                where: { id: parent.commentId },
                data: {
                    repliesCount: {
                        increment: 1,
                    },
                },
            });

            return reply;
        });
    }

    async deleteReply(replyId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const reply = await tx.reply.findUnique({
                where: { id: replyId },
                select: {
                    id: true,
                    authorId: true,
                    path: true,
                    commentId: true,
                    comment: {
                        select: {
                            postId: true,
                        },
                    },
                },
            });

            if (!reply) {
                throw new Error('REPLY_NOT_FOUND');
            }

            if (reply.authorId !== userId) {
                throw new Error('FORBIDDEN');
            }

            if (!reply.comment) {
                throw new Error('COMMENT_NOT_FOUND');
            }

            const { count } = await tx.reply.deleteMany({
                where: {
                    path: {
                        startsWith: reply.path,
                    },
                },
            });

            await tx.post.update({
                where: { id: reply.comment.postId },
                data: {
                    commentsCount: {
                        decrement: count,
                    },
                },
            });

            await tx.comment.update({
                where: { id: reply.commentId },
                data: {
                    repliesCount: {
                        decrement: count,
                    },
                },
            });
        });
    }

    async getRepliesByCommentId(
        commentId: string,
        cursor: string | null = null,
        userId: string | null = null,
    ) {
        const pageSize = 5;

        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
            },
        });

        if (!comment) {
            throw new Error('COMMENT_NOT_FOUND');
        }

        const replies = await prisma.reply.findMany({
            where: {
                commentId,
                parentReplyId: null,
            },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],

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

                replies: {
                    take: 1,
                    select: {
                        id: true,
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

        const result = replies.map((reply) => {
            const likedByMe =
                userId && reply.likes ? reply.likes.length > 0 : false;
            return {
                id: reply.id,
                commentId: reply.commentId,
                authorId: reply.authorId,
                content: reply.content,
                likesCount: reply.likesCount,
                depth: reply.depth,
                path: reply.path,
                createdAt: reply.createdAt,
                author: {
                    id: reply.author.id,
                    name: reply.author.name,
                    avatar: reply.author.avatar,
                    tier: reply.author.tier,
                },
                hasReplies: reply.replies.length > 0,
                likedByMe,
            };
        });

        const nextCursor =
            replies.length === pageSize ? replies[replies.length - 1].id : null;

        return {
            replies: result,
            nextCursor,
            hasMore: replies.length === pageSize,
        };
    }

    async getRepliesByReplyId(
        replyId: string,
        cursor: string | null = null,
        userId: string | null = null,
    ) {
        const pageSize = 5;

        // check parent exists
        const parent = await prisma.reply.findUnique({
            where: { id: replyId },
            select: { id: true },
        });

        if (!parent) {
            throw new Error('REPLY_NOT_FOUND');
        }

        const replies = await prisma.reply.findMany({
            where: {
                parentReplyId: replyId,
            },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],

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

                replies: {
                    take: 1,
                    select: {
                        id: true,
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
            replies.length === pageSize ? replies[replies.length - 1].id : null;

        const result = replies.map((reply) => {
            const likedByMe =
                userId && reply.likes ? reply.likes.length > 0 : false;

            return {
                id: reply.id,
                commentId: reply.commentId,
                authorId: reply.authorId,
                content: reply.content,
                likesCount: reply.likesCount,
                depth: reply.depth,
                path: reply.path,
                createdAt: reply.createdAt,
                author: {
                    id: reply.author.id,
                    name: reply.author.name,
                    avatar: reply.author.avatar,
                    tier: reply.author.tier,
                },
                hasReplies: reply.replies.length > 0,
                likedByMe,
            };
        });

        return {
            replies: result,
            nextCursor,
            hasMore: replies.length === pageSize,
        };
    }
}

export default new ReplyService();
