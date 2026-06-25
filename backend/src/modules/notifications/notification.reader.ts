import { prisma } from '../../lib/client.js';
import socketService from '../../sockets/socket.service.js';
import notificationCount from './notification.count.js';

class NotificationReader {
    private author = {
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
    };
    async getAnswerReplyNotification(
        notificationId: string,
        userId: string,
        role: 'USER' | 'ADMIN',
    ) {
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
                                    createdAt: true,
                                    author: this.author,
                                    totalVoteValue: true,
                                    repliesCount: true,

                                    votes: {
                                        where: { userId },
                                        select: { value: true },
                                    },
                                },
                            },

                            reply: {
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    answerReplies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },
                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
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
            const isAnswerOwner =
                notification.answerReply.answer.author.id === userId;

            let myVote = 0;

            if (notification.answerReply.answer.votes) {
                myVote = notification.answerReply.answer.votes[0]?.value ?? 0;
            }

            const likedByMe = notification.answerReply.reply.likes
                ? notification.answerReply.reply.likes.length > 0
                : false;
            const isReplyOwner =
                notification.answerReply.reply.author.id === userId;
            return {
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReply.questionId,
                    answer: {
                        id: notification.answerReply.answer.id,
                        content: notification.answerReply.answer.content,
                        createdAt: notification.answerReply.answer.createdAt,
                        author: notification.answerReply.answer.author,
                        totalVoteValue:
                            notification.answerReply.answer.totalVoteValue,
                        repliesCount:
                            notification.answerReply.answer.repliesCount,
                        myVote,
                        permissions: {
                            canDelete: isAnswerOwner || role === 'ADMIN',
                            canReport: !isAnswerOwner,
                        },
                    },
                    reply: {
                        id: notification.answerReply.reply.id,
                        content: notification.answerReply.reply.content,
                        createdAt: notification.answerReply.reply.createdAt,
                        likesCount: notification.answerReply.reply.likesCount,
                        depth: notification.answerReply.reply.depth,
                        path: notification.answerReply.reply.path,
                        author: notification.answerReply.reply.author,
                        hasReplies:
                            notification.answerReply.reply.answerReplies
                                .length > 0,
                        likedByMe,
                        permissions: {
                            canDelete: isReplyOwner || role === 'ADMIN',
                            canReport: !isReplyOwner,
                        },
                    },
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

    async getCommentReplyNotification(
        notificationId: string,
        userId: string,
        role: 'USER' | 'ADMIN',
    ) {
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
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    repliesCount: true,

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
                                },
                            },
                            reply: {
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    replies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
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

            const isCommentOwner =
                notification.commentReply.comment.author.id === userId;
            const isCommentLikedByMe = notification.commentReply.comment.likes
                ? notification.commentReply.comment.likes.length > 0
                : false;

            const isReplyLikedByMe = notification.commentReply.reply.likes
                ? notification.commentReply.reply.likes.length > 0
                : false;
            const isReplyOwner =
                notification.commentReply.reply.author.id === userId;

            return {
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.commentReply.postId,
                    comment: {
                        id: notification.commentReply.comment.id,
                        postId: notification.commentReply.postId,
                        content: notification.commentReply.comment.content,
                        likesCount:
                            notification.commentReply.comment.likesCount,
                        repliesCount:
                            notification.commentReply.comment.repliesCount,
                        createdAt: notification.commentReply.comment.createdAt,
                        author: notification.commentReply.comment.author,
                        likedByMe: isCommentLikedByMe,
                        permissions: {
                            canDelete: isCommentOwner || role === 'ADMIN',
                            canReport: !isCommentOwner,
                        },
                    },
                    reply: {
                        id: notification.commentReply.reply.id,
                        createdAt: notification.commentReply.reply.createdAt,
                        content: notification.commentReply.reply.content,
                        author: notification.commentReply.reply.author,
                        likesCount: notification.commentReply.reply.likesCount,
                        depth: notification.commentReply.reply.depth,
                        path: notification.commentReply.reply.path,
                        hasReplies:
                            notification.commentReply.reply.replies.length > 0,
                        likedByMe: isReplyLikedByMe,
                        permissions: {
                            canDelete: isReplyOwner || role === 'ADMIN',
                            canReport: !isReplyOwner,
                        },
                    },
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

    async getAnswerReplyReplyNotification(
        notificationId: string,
        userId: string,
        role: 'USER' | 'ADMIN',
    ) {
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
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    answerReplies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
                                },
                            },
                            reply: {
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    answerReplies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
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

            const isParentReplyLikedByMe = notification.answerReplyReply
                .parentReply.likes
                ? notification.answerReplyReply.parentReply.likes.length > 0
                : false;
            const isParentReplyOwner =
                notification.answerReplyReply.parentReply.author.id === userId;

            const isReplyLikedByMe = notification.answerReplyReply.reply.likes
                ? notification.answerReplyReply.reply.likes.length > 0
                : false;
            const isReplyOwner =
                notification.answerReplyReply.reply.author.id === userId;
            return {
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    questionId: notification.answerReplyReply.questionId,
                    parentReply: {
                        id: notification.answerReplyReply.parentReply.id,
                        createdAt:
                            notification.answerReplyReply.parentReply.createdAt,
                        content:
                            notification.answerReplyReply.parentReply.content,
                        likesCount:
                            notification.answerReplyReply.parentReply
                                .likesCount,
                        depth: notification.answerReplyReply.parentReply.depth,
                        path: notification.answerReplyReply.parentReply.path,
                        author: notification.answerReplyReply.parentReply
                            .author,
                        hasReplies:
                            notification.answerReplyReply.parentReply
                                .answerReplies.length > 0,
                        likedByMe: isParentReplyLikedByMe,
                        permissions: {
                            canDelete: isParentReplyOwner || role === 'ADMIN',
                            canReport: !isParentReplyOwner,
                        },
                    },
                    reply: {
                        id: notification.answerReplyReply.reply.id,
                        createdAt:
                            notification.answerReplyReply.reply.createdAt,
                        content: notification.answerReplyReply.reply.content,
                        likesCount:
                            notification.answerReplyReply.reply.likesCount,
                        depth: notification.answerReplyReply.reply.depth,
                        path: notification.answerReplyReply.reply.path,
                        author: notification.answerReplyReply.reply.author,
                        hasReplies:
                            notification.answerReplyReply.reply.answerReplies
                                .length > 0,
                        likedByMe: isReplyLikedByMe,
                        permissions: {
                            canDelete: isReplyOwner || role === 'ADMIN',
                            canReport: !isReplyOwner,
                        },
                    },
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

    async getCommentReplyReplyNotification(
        notificationId: string,
        userId: string,
        role: 'USER' | 'ADMIN',
    ) {
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
                                    createdAt: true,
                                    content: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    replies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
                                },
                            },
                            reply: {
                                select: {
                                    id: true,
                                    content: true,
                                    createdAt: true,
                                    author: this.author,
                                    likesCount: true,
                                    depth: true,
                                    path: true,

                                    replies: {
                                        take: 1,
                                        select: {
                                            id: true,
                                        },
                                    },

                                    likes: {
                                        where: { userId },
                                        select: { userId: true },
                                    },
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

            const isParentReplyLikedByMe = notification.commentReplyReply
                .parentReply.likes
                ? notification.commentReplyReply.parentReply.likes.length > 0
                : false;
            const isParentReplyOwner =
                notification.commentReplyReply.parentReply.author.id === userId;

            const isReplyLikedByMe = notification.commentReplyReply.reply.likes
                ? notification.commentReplyReply.reply.likes.length > 0
                : false;
            const isReplyOwner =
                notification.commentReplyReply.reply.author.id === userId;
            return {
                recipientId: notification.recipientId,
                shouldEmit: wasUnread,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    isRead: true,
                    createdAt: notification.createdAt,
                    postId: notification.commentReplyReply.postId,
                    parentReply: {
                        id: notification.commentReplyReply.parentReply.id,
                        createdAt:
                            notification.commentReplyReply.parentReply
                                .createdAt,
                        content:
                            notification.commentReplyReply.parentReply.content,
                        likesCount:
                            notification.commentReplyReply.parentReply
                                .likesCount,
                        depth: notification.commentReplyReply.parentReply.depth,
                        path: notification.commentReplyReply.parentReply.path,
                        author: notification.commentReplyReply.parentReply
                            .author,
                        hasReplies:
                            notification.commentReplyReply.parentReply.replies
                                .length > 0,
                        likedByMe: isParentReplyLikedByMe,
                        permissions: {
                            canDelete: isParentReplyOwner || role === 'ADMIN',
                            canReport: !isParentReplyOwner,
                        },
                    },
                    reply: {
                        id: notification.commentReplyReply.reply.id,
                        createdAt:
                            notification.commentReplyReply.reply.createdAt,
                        content: notification.commentReplyReply.reply.content,
                        likesCount:
                            notification.commentReplyReply.reply.likesCount,
                        depth: notification.commentReplyReply.reply.depth,
                        path: notification.commentReplyReply.reply.path,
                        author: notification.commentReplyReply.reply.author,
                        hasReplies:
                            notification.commentReplyReply.reply.replies
                                .length > 0,
                        likedByMe: isReplyLikedByMe,
                        permissions: {
                            canDelete: isReplyOwner || role === 'ADMIN',
                            canReport: !isReplyOwner,
                        },
                    },
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
                            lastComment: {
                                select: {
                                    postId: true,
                                    id: true,
                                    content: true,
                                    likesCount: true,
                                    createdAt: true,
                                    repliesCount: true,
                                    author: this.author,
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
                    comment: notification.postComment.lastComment,
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
                            lastAnswer: {
                                select: {
                                    questionId: true,
                                    id: true,
                                    content: true,
                                    totalVoteValue: true,
                                    createdAt: true,
                                    repliesCount: true,
                                    author: this.author,
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
                    answer: notification.questionAnswer.lastAnswer,
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
