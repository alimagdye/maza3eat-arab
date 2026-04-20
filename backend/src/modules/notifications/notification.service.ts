import { CreateReplyNotificationParams } from '../../types/notification.js';
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
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
                type: true,
                isRead: true,
                createdAt: true,

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
}

export default new NotificationService();
