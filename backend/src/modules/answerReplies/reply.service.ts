import { prisma } from '../../lib/client.js';
import replyUtils from './reply.utils.js';
import NotificationService from '../notifications/notification.service.js';
class ReplyService {
    private MAX_DEPTH = 10;
    private notificationService = NotificationService;
    async replyToAnswer(answerId: string, userId: string, content: string) {
        const result = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
                SELECT id FROM "Answer"
                WHERE id = ${answerId}
                FOR UPDATE
            `;

            const answer = await tx.answer.findUnique({
                where: { id: answerId },
                select: {
                    id: true,
                    questionId: true,
                    authorId: true,
                },
            });

            if (!answer) {
                throw new Error('answer_NOT_FOUND');
            }

            const lastRootReply = await tx.answerReply.findFirst({
                where: {
                    answerId,
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

            const path = answer.id + '.' + segment;

            const reply = await tx.answerReply.create({
                data: {
                    content,
                    answerId,
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

            await tx.question.update({
                where: { id: answer.questionId },
                data: {
                    answersCount: {
                        increment: 1,
                    },
                },
            });

            await tx.answer.update({
                where: { id: answerId },
                data: {
                    repliesCount: {
                        increment: 1,
                    },
                },
            });

            return { reply, answer };
        });

        await this.notificationService.createReplyNotification({
            recipientId: result.answer.authorId,
            actorId: userId,

            questionId: result.answer.questionId,
            answerId: result.answer.id,
            replyId: result.reply.id,
            type: 'ANSWER_REPLY',
        });

        return result.reply;
    }

    async replyToReply(replyId: string, userId: string, content: string) {
        const MAX_DEPTH = this.MAX_DEPTH;

        const result = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
                SELECT id FROM "AnswerReply"
                WHERE id = ${replyId}
                FOR UPDATE
            `;

            const parent = await tx.answerReply.findUnique({
                where: { id: replyId },
                select: {
                    id: true,
                    authorId: true,
                    depth: true,
                    path: true,
                    answerId: true,
                    answer: {
                        select: {
                            questionId: true,
                        },
                    },
                },
            });

            if (!parent) {
                throw new Error('REPLY_NOT_FOUND');
            }

            if (!parent.answer) {
                throw new Error('answer_NOT_FOUND');
            }

            const depth = parent.depth + 1;

            if (depth > MAX_DEPTH) {
                throw new Error('MAX_DEPTH_REACHED');
            }

            const lastChild = await tx.answerReply.findFirst({
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

            const reply = await tx.answerReply.create({
                data: {
                    content,
                    answerId: parent.answerId,
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

            await tx.question.update({
                where: { id: parent.answer.questionId },
                data: {
                    answersCount: {
                        increment: 1,
                    },
                },
            });

            await tx.answer.update({
                where: { id: parent.answerId },
                data: {
                    repliesCount: {
                        increment: 1,
                    },
                },
            });

            return { reply, parent };
        });

        await this.notificationService.createReplyNotification({
            recipientId: result.parent.authorId,
            actorId: userId,

            questionId: result.parent.answer.questionId,
            parentReplyId: result.parent.id,
            replyId: result.reply.id,
            type: 'ANSWER_REPLY_REPLY',
        });

        return result.reply;
    }

    async deleteReply(replyId: string, userId: string) {
        return await prisma.$transaction(async (tx) => {
            const reply = await tx.answerReply.findUnique({
                where: { id: replyId },
                select: {
                    id: true,
                    authorId: true,
                    path: true,
                    answerId: true,
                    answer: {
                        select: {
                            questionId: true,
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

            if (!reply.answer) {
                throw new Error('answer_NOT_FOUND');
            }

            const { count } = await tx.answerReply.deleteMany({
                where: {
                    path: {
                        startsWith: reply.path,
                    },
                },
            });

            await tx.question.update({
                where: { id: reply.answer.questionId },
                data: {
                    answersCount: {
                        decrement: count,
                    },
                },
            });

            await tx.answer.update({
                where: { id: reply.answerId },
                data: {
                    repliesCount: {
                        decrement: count,
                    },
                },
            });
        });
    }

    async getRepliesByAnswerId(
        answerId: string,
        cursor: string | null = null,
        userId: string | null = null,
        excludeReplyId: string | null = null,
    ) {
        const pageSize = 5;

        const answer = await prisma.answer.findUnique({
            where: { id: answerId },
            select: {
                id: true,
            },
        });

        if (!answer) {
            throw new Error('answer_NOT_FOUND');
        }

        const replies = await prisma.answerReply.findMany({
            where: {
                answerId,
                parentReplyId: null,
                ...(excludeReplyId && {
                    NOT: { id: excludeReplyId },
                }),
            },

            take: pageSize + 1,

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
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },

                answerReplies: {
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

        const hasMore = replies.length > pageSize;

        if (hasMore) replies.pop();

        const result = replies.map((reply) => {
            const likedByMe =
                userId && reply.likes ? reply.likes.length > 0 : false;
            const isOwner = !!userId && reply.authorId === userId;

            return {
                id: reply.id,
                answerId: reply.answerId,
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
                hasReplies: reply.answerReplies.length > 0,
                likedByMe,
                permissions: {
                    canDelete: isOwner,
                    canReport: !isOwner,
                },
            };
        });

        const nextCursor = hasMore ? replies[replies.length - 1].id : null;

        return {
            replies: result,
            nextCursor,
            hasMore,
        };
    }

    async getRepliesByReplyId(
        replyId: string,
        cursor: string | null = null,
        userId: string | null = null,
        excludeReplyId: string | null = null,
    ) {
        const pageSize = 5;

        const parent = await prisma.answerReply.findUnique({
            where: { id: replyId },
            select: {
                id: true,
                answerId: true,
                content: true,
                likesCount: true,
                depth: true,
                path: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
                answer: {
                    select: {
                        questionId: true,
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

        if (!parent) {
            throw new Error('REPLY_NOT_FOUND');
        }

        const replies = await prisma.answerReply.findMany({
            where: {
                parentReplyId: replyId,
                ...(excludeReplyId && {
                    NOT: { id: excludeReplyId },
                }),
            },

            take: pageSize + 1,

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
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },

                answerReplies: {
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

        const hasMore = replies.length > pageSize;

        if (hasMore) replies.pop();

        const result = replies.map((reply) => {
            const likedByMe =
                userId && reply.likes ? reply.likes.length > 0 : false;
            const isOwner = !!userId && reply.authorId === userId;

            return {
                id: reply.id,
                answerId: reply.answerId,
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
                hasReplies: reply.answerReplies.length > 0,
                likedByMe,
                permissions: {
                    canDelete: isOwner,
                    canReport: !isOwner,
                },
            };
        });

        const nextCursor = hasMore ? replies[replies.length - 1].id : null;
        const isParentOwner = !!userId && parent.author.id === userId;
        return {
            questionId: parent.answer.questionId,
            parentReply: {
                id: parent.id,
                content: parent.content,
                likesCount: parent.likesCount,
                depth: parent.depth,
                path: parent.path,
                createdAt: parent.createdAt,
                author: parent.author,
                likedByMe:
                    userId && parent.likes ? parent.likes.length > 0 : false,
                permissions: {
                    canDelete: isParentOwner,
                    canReport: !isParentOwner,
                },
            },
            replies: result,
            nextCursor,
            hasMore,
        };
    }
}

export default new ReplyService();
