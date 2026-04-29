import {
    CreateReplyNotificationParams,
    CreateCommentNotificationParams,
    CreatePostOrQuestionLikeNotificationParams,
} from '../../types/notification.js';
import { prisma } from '../../lib/client.js';
import socketService from '../../sockets/socket.service.js';
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
        socketService.emitNotificationCount(
            recipientId,
            await this.getUnreadNotificationCount(recipientId),
        );
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

        let shouldEmit = false;

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
                select: { id: true, isRead: true },
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

                // unread count increases only when read -> unread
                if (existing.isRead) {
                    shouldEmit = true;
                }

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
            shouldEmit = true;

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
        if (shouldEmit) {
            socketService.emitNotificationCount(
                recipientId,
                await this.getUnreadNotificationCount(recipientId),
            );
        }
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

        let shouldEmit = false;

        await prisma.$transaction(async (tx) => {
            // 1. find existing
            const existing = await tx.notification.findFirst({
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
                    isRead: true,
                },
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
                    select: {
                        id: true,
                    },
                });

                // unread count increases only when read -> unread
                if (existing.isRead) {
                    shouldEmit = true;
                }

                await tx.notification.update({
                    where: {
                        id: existing.id,
                    },
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
            shouldEmit = true;

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

        // emit only when unread count actually changed
        if (shouldEmit) {
            socketService.emitNotificationCount(
                recipientId,
                await this.getUnreadNotificationCount(recipientId),
            );
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
            case 'POST_LIKE':
                return this.getPostLikeNotification(notificationId);
            case 'QUESTION_LIKE':
                return this.getQuestionLikeNotification(notificationId);
            default:
                return null;
        }
    }

    async getAnswerReplyNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: {
                    id: notificationId,
                },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    recipientId: true,

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

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            // target deleted -> auto mark read + return null
            if (!notification?.answerReply) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            // normal case -> mark read once
            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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
        // if parent notification is deleted
        if (!result) {
            return null;
        }

        // emit after commit
        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        // if answerReply was deleted
        if (!result.notification) {
            return null;
        }

        return {
            notification: result.notification,
        };
    }

    async getCommentReplyNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: {
                    id: notificationId,
                },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    recipientId: true,
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

            if (!notification) {
                return null;
            }
            const wasUnread = !notification.isRead;

            if (!notification?.commentReply) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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

        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getAnswerReplyReplyNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: {
                    id: notificationId,
                },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    recipientId: true,
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

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            if (!notification?.answerReplyReply) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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

        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getCommentReplyReplyNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: {
                    id: notificationId,
                },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    recipientId: true,
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

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            if (!notification?.commentReplyReply) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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
        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getCommentNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    recipientId: true,
                    postComment: {
                        select: {
                            postId: true,
                            lastCommentId: true,
                        },
                    },
                },
            });

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            // case: post is deleted
            if (!notification?.postComment) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
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

                // case: all comments are deleted
                if (!fallback) {
                    if (wasUnread) {
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
                        recipientId: notification.recipientId,
                        shouldEmit: wasUnread,
                        notification: null,
                    };
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

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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
        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getAnswerNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    recipientId: true,
                    questionAnswer: {
                        select: {
                            questionId: true,
                            lastAnswerId: true,
                        },
                    },
                },
            });

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            if (!notification.questionAnswer) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
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
                    if (wasUnread) {
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
                        recipientId: notification.recipientId,
                        shouldEmit: wasUnread,
                        notification: null,
                    };
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

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
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
        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getQuestionLikeNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await tx.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    recipientId: true,
                    questionLike: {
                        select: {
                            questionId: true,
                        },
                    },
                },
            });

            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            if (!notification?.questionLike) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.questionLike.questionId,
                },
            };
        });
        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getPostLikeNotification(notificationId: string) {
        const result = await prisma.$transaction(async (tx) => {
            const notification = await prisma.notification.findUnique({
                where: { id: notificationId },
                select: {
                    id: true,
                    type: true,
                    isRead: true,
                    createdAt: true,
                    lastActivityAt: true,
                    recipientId: true,
                    postLike: {
                        select: {
                            postId: true,
                        },
                    },
                },
            });
            if (!notification) {
                return null;
            }

            const wasUnread = !notification.isRead;

            if (!notification?.postLike) {
                if (wasUnread) {
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
                    recipientId: notification.recipientId,
                    shouldEmit: wasUnread,
                    notification: null,
                };
            }

            if (wasUnread) {
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
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.postLike.postId,
                },
            };
        });
        if (!result) {
            return null;
        }

        if (result.shouldEmit) {
            socketService.emitNotificationCount(
                result.recipientId,
                await this.getUnreadNotificationCount(result.recipientId),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getUnreadNotificationCount(userId: string) {
        const notifications = await prisma.notification.findMany({
            where: {
                recipientId: userId,
                isRead: false,
            },
            select: {
                id: true,
            },
            take: 100,
        });

        // already capped
        if (notifications.length >= 100) {
            return {
                count: 99,
                isCapped: true,
            };
        }

        // only fetch remaining needed
        const remaining = 100 - notifications.length;

        const requests = await prisma.contactRequest.findMany({
            where: {
                OR: [
                    {
                        requesterId: userId,
                        status: 'ACCEPTED',
                        requesterHasRead: false,
                    },
                    {
                        receiverId: userId,
                        status: 'PENDING',
                        receiverHasRead: false,
                    },
                ],
            },
            select: {
                id: true,
            },
            take: remaining,
        });

        const total = notifications.length + requests.length;

        return {
            count: Math.min(total, 99),
            isCapped: total >= 100,
        };
    }
}

export default new NotificationService();
