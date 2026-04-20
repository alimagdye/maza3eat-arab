import {
    CreateReplyNotificationParams,
    CreateCommentNotificationParams,
} from '../../types/notification.js';
import { prisma } from '../../lib/client.js';
class NotificationService {
    async createReplyNotification(params: CreateReplyNotificationParams) {
        const { recipientId, actorId, type, replyId } = params;
        if (recipientId === actorId) return;
        const data: any = {
            type,
            recipientId,
            lastActorId: actorId,
        };
        if (type === 'ANSWER_REPLY') {
            data.answerReply = {
                create: {
                    questionId: params.questionId,
                    answerId: params.answerId,
                    replyId,
                },
            };
        }
        if (type === 'COMMENT_REPLY') {
            data.commentReply = {
                create: {
                    postId: params.postId,
                    commentId: params.commentId,
                    replyId,
                },
            };
        }
        if (type === 'COMMENT_REPLY_REPLY') {
            data.commentReplyReply = {
                create: {
                    postId: params.postId,
                    parentReplyId: params.parentReplyId,
                    replyId,
                },
            };
        }
        if (type === 'ANSWER_REPLY_REPLY') {
            data.answerReplyReply = {
                create: {
                    questionId: params.questionId,
                    parentReplyId: params.parentReplyId,
                    replyId,
                },
            };
        }

        await prisma.notification.create({ data });
    }

    async createCommentOrAnswerNotification(
        params: CreateCommentNotificationParams,
    ) {
        const { recipientId, actorId, type } = params;

        // prevent self notification
        if (recipientId === actorId) return;

        const groupKey =
            type === 'COMMENT'
                ? `POST_COMMENT:${params.postId}`
                : `QUESTION_ANSWER:${params.questionId}`;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // 1. find existing notification
        const existing = await prisma.notification.findFirst({
            where: {
                recipientId,
                type,
                groupKey,
                createdAt: {
                    gte: oneHourAgo,
                },
            },
            select: {
                id: true,
            },
        });

        // 2. if exists: update
        if (existing) {
            // check if actor already exists
            const existingActor = await prisma.notificationActor.findUnique({
                where: {
                    notificationId_actorId: {
                        notificationId: existing.id,
                        actorId,
                    },
                },
                select: { id: true },
            });

            // update notification
            await prisma.notification.update({
                where: { id: existing.id },
                data: {
                    lastActorId: actorId,
                    isRead: false,
                    lastActivityAt: new Date(),

                    ...(existingActor
                        ? {} // actor already counted
                        : {
                              numberOfActors: {
                                  increment: 1,
                              },
                          }),
                },
            });

            // update subtype
            if (type === 'COMMENT') {
                await prisma.postCommentNotification.update({
                    where: { notificationId: existing.id },
                    data: {
                        lastCommentId: params.commentId,
                    },
                });
            }
            if (type === 'ANSWER') {
                await prisma.questionAnswerNotification.update({
                    where: { notificationId: existing.id },
                    data: {
                        lastAnswerId: params.answerId,
                    },
                });
            }

            // add actor only if new
            if (!existingActor) {
                await prisma.notificationActor.create({
                    data: {
                        notificationId: existing.id,
                        actorId,
                    },
                });
            }

            return;
        }
        // else: create new notification
        if (type === 'COMMENT') {
            await prisma.notification.create({
                data: {
                    type,
                    recipientId,
                    groupKey,
                    lastActorId: actorId,
                    lastActivityAt: new Date(),

                    postComment: {
                        create: {
                            postId: params.postId,
                            lastCommentId: params.commentId,
                        },
                    },

                    actors: {
                        create: {
                            actorId,
                        },
                    },
                },
            });
        }
        if (type === 'ANSWER') {
            await prisma.notification.create({
                data: {
                    type,
                    recipientId,
                    groupKey,
                    lastActorId: actorId,
                    lastActivityAt: new Date(),

                    questionAnswer: {
                        create: {
                            questionId: params.questionId,
                            lastAnswerId: params.answerId,
                        },
                    },

                    actors: {
                        create: {
                            actorId,
                        },
                    },
                },
            });
        }
    }

    async getNotifications(userId: string, cursor: string | null) {
        const take = 10;

        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: userId,
            },
            take,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: [{ lastActivityAt: 'desc' }, { id: 'desc' }],
            select: {
                id: true,
                type: true,
                isRead: true,
                lastActivityAt: true,
                numberOfActors: true,

                lastActor: {
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
            },
        });

        const hasMore = notifications.length === take;

        const nextCursor = hasMore
            ? notifications[notifications.length - 1].id
            : null;

        return { notifications, nextCursor, hasMore };
    }

    async getNotificationById(userId: string, notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: {
                type: true,
                recipientId: true,
            },
        });

        if (!notification || notification.recipientId !== userId) {
            return null;
        }

        switch (notification.type) {
            case 'ANSWER_REPLY':
                return this.getAnswerReplyNotification(notificationId);
            case 'COMMENT_REPLY':
                return this.getCommentReplyNotification(notificationId);
            case 'ANSWER_REPLY_REPLY':
                return this.getAnswerReplyReplyNotification(notificationId);
            case 'COMMENT_REPLY_REPLY':
                return this.getCommentReplyReplyNotification(notificationId);
            case 'COMMENT':
                return this.getCommentNotification(notificationId);
            case 'ANSWER':
                return this.getAnswerNotification(notificationId);
            default:
                return null;
        }
    }

    async getAnswerReplyNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                answerReply: {
                    select: {
                        questionId: true,
                        answer: {
                            select: {
                                id: true,
                                content: true,
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
                                totalVoteValue: true,
                                repliesCount: true,
                            },
                        },
                        reply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (notification?.answerReply) {
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReply.questionId,
                    answer: notification.answerReply.answer,
                    reply: notification.answerReply.reply,
                },
            };
        } else {
            return null;
        }
    }

    async getCommentReplyNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                commentReply: {
                    select: {
                        postId: true,
                        comment: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                repliesCount: true,
                            },
                        },
                        reply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (notification?.commentReply) {
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt,
                    postId: notification.commentReply.postId,
                    comment: notification.commentReply.comment,
                    reply: notification.commentReply.reply,
                },
            };
        } else {
            return null;
        }
    }

    async getAnswerReplyReplyNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                answerReplyReply: {
                    select: {
                        questionId: true,
                        parentReply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                        reply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (notification?.answerReplyReply) {
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReplyReply.questionId,
                    parentReply: notification.answerReplyReply.parentReply,
                    reply: notification.answerReplyReply.reply,
                },
            };
        } else {
            return null;
        }
    }

    async getCommentReplyReplyNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: {
                id: notificationId,
            },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                commentReplyReply: {
                    select: {
                        postId: true,
                        parentReply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                        reply: {
                            select: {
                                id: true,
                                content: true,
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
                                likesCount: true,
                                depth: true,
                                path: true,
                            },
                        },
                    },
                },
            },
        });
        if (notification?.commentReplyReply) {
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt,
                    postId: notification.commentReplyReply.postId,
                    parentReply: notification.commentReplyReply.parentReply,
                    reply: notification.commentReplyReply.reply,
                },
            };
        } else {
            return null;
        }
    }

    async getCommentNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                lastActivityAt: true,
                postComment: {
                    select: {
                        postId: true,
                        lastCommentId: true,
                    },
                },
            },
        });

        if (!notification || !notification.postComment) {
            return null;
        }

        let { lastCommentId, postId } = notification.postComment;

        // Fix if lastComment was deleted
        if (!lastCommentId) {
            const fallback = await prisma.comment.findFirst({
                where: {
                    postId,
                    createdAt: {
                        gte: notification.createdAt,
                        lte: notification.lastActivityAt,
                    },
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });

            if (!fallback) {
                return null;
            }

            // persist fix
            await prisma.postCommentNotification.update({
                where: { notificationId },
                data: {
                    lastCommentId: fallback.id,
                },
            });

            lastCommentId = fallback.id;
        }

        return {
            notification: {
                id: notification.id,
                type: notification.type,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
                postId,
                lastCommentId,
            },
        };
    }

    async getAnswerNotification(notificationId: string) {
        const notification = await prisma.notification.findUnique({
            where: { id: notificationId },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,
                lastActivityAt: true,
                questionAnswer: {
                    select: {
                        questionId: true,
                        lastAnswerId: true,
                    },
                },
            },
        });

        if (!notification || !notification.questionAnswer) {
            return null;
        }

        let { lastAnswerId, questionId } = notification.questionAnswer;

        // Fix if lastAnswer was deleted
        if (!lastAnswerId) {
            const fallback = await prisma.answer.findFirst({
                where: {
                    questionId,
                    createdAt: {
                        gte: notification.createdAt,
                        lte: notification.lastActivityAt,
                    },
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });

            if (!fallback) {
                return null;
            }

            // persist fix
            await prisma.questionAnswerNotification.update({
                where: { notificationId },
                data: {
                    lastAnswerId: fallback.id,
                },
            });

            lastAnswerId = fallback.id;
        }

        return {
            notification: {
                id: notification.id,
                type: notification.type,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
                questionId,
                lastAnswerId,
            },
        };
    }
}

export default new NotificationService();
