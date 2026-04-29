import {
    CreateReplyNotificationParams,
    CreateCommentNotificationParams,
    CreatePostOrQuestionLikeNotificationParams,
} from '../../types/notification.js';
import { prisma } from '../../lib/client.js';
import socketService from '../../sockets/socket.service.js';
import notificationCount from './notification.count.js';

class NotificationWriter {
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
            await notificationCount.getUnreadNotificationCount(recipientId),
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
                await notificationCount.getUnreadNotificationCount(recipientId),
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
                await notificationCount.getUnreadNotificationCount(recipientId),
            );
        }
    }
}
export default new NotificationWriter();
