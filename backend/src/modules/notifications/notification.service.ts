import {
    CreateReplyNotificationParams,
    CreateCommentNotificationParams,
    CreatePostOrQuestionLikeNotificationParams,
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

        if (recipientId === actorId) return;

        const groupKey =
            type === 'COMMENT'
                ? `POST_COMMENT:${params.postId}`
                : `QUESTION_ANSWER:${params.questionId}`;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const now = new Date();

        await prisma.$transaction(async (tx) => {
            // 1. find existing (INSIDE transaction)
            const existing = await tx.notification.findFirst({
                where: {
                    recipientId,
                    type,
                    groupKey,
                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
                select: { id: true },
            });

            // 2. update existing
            if (existing) {
                const existingActor = await tx.notificationActor.findUnique({
                    where: {
                        notificationId_actorId: {
                            notificationId: existing.id,
                            actorId,
                        },
                    },
                    select: { id: true },
                });

                await tx.notification.update({
                    where: { id: existing.id },
                    data: {
                        lastActorId: actorId,
                        isRead: false,
                        lastActivityAt: now,
                        ...(existingActor
                            ? {}
                            : {
                                  numberOfActors: {
                                      increment: 1,
                                  },
                              }),
                    },
                });

                // subtype update
                if (type === 'COMMENT') {
                    await tx.postCommentNotification.update({
                        where: { notificationId: existing.id },
                        data: {
                            lastCommentId: params.commentId,
                        },
                    });
                } else {
                    await tx.questionAnswerNotification.update({
                        where: { notificationId: existing.id },
                        data: {
                            lastAnswerId: params.answerId,
                        },
                    });
                }

                // insert actor if new
                if (!existingActor) {
                    await tx.notificationActor.create({
                        data: {
                            notificationId: existing.id,
                            actorId,
                        },
                    });
                }

                return;
            }

            // 3. create new notification
            await tx.notification.create({
                data: {
                    type,
                    recipientId,
                    groupKey,
                    lastActorId: actorId,
                    lastActivityAt: now,

                    ...(type === 'COMMENT'
                        ? {
                              postComment: {
                                  create: {
                                      postId: params.postId,
                                      lastCommentId: params.commentId,
                                  },
                              },
                          }
                        : {
                              questionAnswer: {
                                  create: {
                                      questionId: params.questionId,
                                      lastAnswerId: params.answerId,
                                  },
                              },
                          }),

                    actors: {
                        create: {
                            actorId,
                        },
                    },
                },
            });
        });
    }

    async createPostOrQuestionLikeNotification(
        params: CreatePostOrQuestionLikeNotificationParams,
    ) {
        const { recipientId, actorId, type } = params;

        // prevent self notification
        if (recipientId === actorId) return;

        const groupKey =
            type === 'POST_LIKE'
                ? `POST_LIKE:${params.postId}`
                : `QUESTION_LIKE:${params.questionId}`;

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const now = new Date();

        await prisma.$transaction(async (tx) => {
            // 1. find existing (INSIDE transaction)
            const existing = await tx.notification.findFirst({
                where: {
                    recipientId,
                    type,
                    groupKey,
                    createdAt: {
                        gte: oneHourAgo,
                    },
                },
                select: { id: true },
            });

            // 2. if exists update
            if (existing) {
                const existingActor = await tx.notificationActor.findUnique({
                    where: {
                        notificationId_actorId: {
                            notificationId: existing.id,
                            actorId,
                        },
                    },
                    select: { id: true },
                });

                // update notification
                await tx.notification.update({
                    where: { id: existing.id },
                    data: {
                        lastActorId: actorId,
                        isRead: false,
                        lastActivityAt: now,
                        ...(existingActor
                            ? {}
                            : {
                                  numberOfActors: {
                                      increment: 1,
                                  },
                              }),
                    },
                });

                // add actor only if new
                if (!existingActor) {
                    await tx.notificationActor.create({
                        data: {
                            notificationId: existing.id,
                            actorId,
                        },
                    });
                }

                return;
            }

            // 3. create new notification
            await tx.notification.create({
                data: {
                    type,
                    recipientId,
                    groupKey,
                    lastActorId: actorId,
                    lastActivityAt: now,

                    ...(type === 'POST_LIKE'
                        ? {
                              postLike: {
                                  create: {
                                      postId: params.postId,
                                  },
                              },
                          }
                        : {
                              questionLike: {
                                  create: {
                                      questionId: params.questionId,
                                  },
                              },
                          }),

                    actors: {
                        create: {
                            actorId,
                        },
                    },
                },
            });
        });
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
            case 'POST_LIKE':
                return this.getPostLikeNotification(notificationId);
            case 'QUESTION_LIKE':
                return this.getQuestionLikeNotification(notificationId);
            default:
                return null;
        }
    }

    async getAnswerReplyNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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

            if (!notification?.answerReply) {
                return null;
            }

            // mark as read only once
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }

            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReply.questionId,
                    answer: notification.answerReply.answer,
                    reply: notification.answerReply.reply,
                },
            };
        });
    }

    async getCommentReplyNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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
            if (!notification?.commentReply) {
                return null;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.commentReply.postId,
                    comment: notification.commentReply.comment,
                    reply: notification.commentReply.reply,
                },
            };
        });
    }

    async getAnswerReplyReplyNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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
            if (!notification?.answerReplyReply) {
                return null;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReplyReply.questionId,
                    parentReply: notification.answerReplyReply.parentReply,
                    reply: notification.answerReplyReply.reply,
                },
            };
        });
    }

    async getCommentReplyReplyNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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
            if (!notification?.commentReplyReply) {
                return null;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }
            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.commentReplyReply.postId,
                    parentReply: notification.commentReplyReply.parentReply,
                    reply: notification.commentReplyReply.reply,
                },
            };
        });
    }

    async getCommentNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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
                const fallback = await tx.comment.findFirst({
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
                await tx.postCommentNotification.update({
                    where: { notificationId },
                    data: {
                        lastCommentId: fallback.id,
                    },
                });

                lastCommentId = fallback.id;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }

            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId,
                    lastCommentId,
                },
            };
        });
    }

    async getAnswerNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
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
                const fallback = await tx.answer.findFirst({
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
                await tx.questionAnswerNotification.update({
                    where: { notificationId },
                    data: {
                        lastAnswerId: fallback.id,
                    },
                });

                lastAnswerId = fallback.id;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }

            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId,
                    lastAnswerId,
                },
            };
        });
    }

    async getQuestionLikeNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    questionLike: {
                        select: {
                            questionId: true,
                        },
                    },
                },
            });
            if (!notification?.questionLike) {
                return null;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }

            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.questionLike.questionId,
                },
            };
        });
    }

    async getPostLikeNotification(notificationId: string) {
        return await prisma.$transaction(async (tx) => {
            const notification = await prisma.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    postLike: {
                        select: {
                            postId: true,
                        },
                    },
                },
            });
            if (!notification?.postLike) {
                return null;
            }
            if (!notification.isRead) {
                await tx.notification.update({
                    where: {
                        id: notificationId,
                    },
                    data: {
                        isRead: true,
                    },
                });
            }

            return {
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.postLike.postId,
                },
            };
        });
    }

    async getUnreadNotificationCount(userId: string) {
        return await prisma.notification.count({
            where: {
                recipientId: userId,
                isRead: false,
            },
        });
    }
}

export default new NotificationService();
