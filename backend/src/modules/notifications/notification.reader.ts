import { prisma } from '../../lib/client.js';
import socketService from '../../sockets/socket.service.js';
import notificationCount from './notification.count.js';

class NotificationReader {
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }

    async getPostLikeNotification(notificationId: string) {
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
                await notificationCount.getUnreadNotificationCount(
                    result.recipientId,
                ),
            );
        }

        if (!result.notification) {
            return null;
        }

        return { notification: result.notification };
    }
}

export default new NotificationReader();
