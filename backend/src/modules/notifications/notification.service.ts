import { CreateReplyNotificationParams } from '../../types/notification.js';
import { prisma } from '../../lib/client.js';
class NotificationService {
    async createReplyNotification(params: CreateReplyNotificationParams) {
        const { tx, recipientId, actorId, type, replyId } = params;

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

        await tx.notification.create({ data });
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
}

export default new NotificationService();
