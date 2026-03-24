import { prisma } from '../../prisma/client.js';
import replyUtils from './reply.utils.js';

class ReplyService {
    private MAX_DEPTH = 10;
    async replyToAnswer(answerId: string, userId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const answer = await tx.answer.findUnique({
                where: { id: answerId },
                select: {
                    id: true,
                    questionId: true,
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

            const path = segment;

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

            return reply;
        });
    }

    async replyToReply(replyId: string, userId: string, content: string) {
        const MAX_DEPTH = this.MAX_DEPTH;

        return await prisma.$transaction(async (tx) => {
            const parent = await tx.answerReply.findUnique({
                where: { id: replyId },
                select: {
                    id: true,
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

            return reply;
        });
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

    async getRepliesByAnswerId(answerId: string, cursor: string | null = null) {
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
            },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: {
                createdAt: 'asc',
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

                answerReplies: {
                    take: 1,
                    select: {
                        id: true,
                    },
                },
            },
        });

        const result = replies.map((reply) => ({
            id: reply.id,
            answerId: reply.answerId,
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
            hasReplies: reply.answerReplies.length > 0,
        }));

        const nextCursor =
            replies.length === pageSize ? replies[replies.length - 1].id : null;

        return {
            replies: result,
            nextCursor,
            hasMore: replies.length === pageSize,
        };
    }

    async getRepliesByReplyId(replyId: string, cursor: string | null = null) {
        const pageSize = 5;

        const parent = await prisma.answerReply.findUnique({
            where: { id: replyId },
            select: { id: true },
        });

        if (!parent) {
            throw new Error('REPLY_NOT_FOUND');
        }

        const replies = await prisma.answerReply.findMany({
            where: {
                parentReplyId: replyId,
            },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: {
                createdAt: 'asc',
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

                answerReplies: {
                    take: 1,
                    select: {
                        id: true,
                    },
                },
            },
        });

        const nextCursor =
            replies.length === pageSize ? replies[replies.length - 1].id : null;

        const result = replies.map((reply) => ({
            id: reply.id,
            answerId: reply.answerId,
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
            hasReplies: reply.answerReplies.length > 0,
        }));

        return {
            replies: result,
            nextCursor,
            hasMore: replies.length === pageSize,
        };
    }
}

export default new ReplyService();
