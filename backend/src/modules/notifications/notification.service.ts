import { prisma } from '../../lib/client.js';
import { NotificationType } from '@prisma/client';
import notificationReader from './notification.reader.js';
import notificationWriter from './notification.writer.js';
import notificationCount from './notification.count.js';

class NotificationService {
    // Writers
    createReplyNotification =
        notificationWriter.createReplyNotification.bind(notificationWriter);
    createCommentOrAnswerNotification =
        notificationWriter.createCommentOrAnswerNotification.bind(
            notificationWriter,
        );
    createPostOrQuestionLikeNotification =
        notificationWriter.createPostOrQuestionLikeNotification.bind(
            notificationWriter,
        );
    createPostOrQuestionApprovalNotification =
        notificationWriter.createPostOrQuestionApprovalNotification.bind(
            notificationWriter,
        );
    createPostOrQuestionRejectionNotification =
        notificationWriter.createPostOrQuestionRejectionNotification.bind(
            notificationWriter,
        );
    // counter
    getUnreadNotificationCount =
        notificationCount.getUnreadNotificationCount.bind(notificationCount);

    private HIDE_ACTOR_TYPES = new Set<NotificationType>([
        'POST_APPROVAL',
        'QUESTION_APPROVAL',
        'POST_REJECTION',
        'QUESTION_REJECTION',
    ]);

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

        return {
            notifications: notifications.map((notification) => ({
                ...notification,
                lastActor: this.HIDE_ACTOR_TYPES.has(notification.type)
                    ? null
                    : notification.lastActor,
            })),
            nextCursor,
            hasMore,
        };
    }

    async getNotificationById(
        userId: string,
        notificationId: string,
        role: 'USER' | 'ADMIN',
    ) {
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
                return notificationReader.getAnswerReplyNotification(
                    notificationId,
                    userId,
                    role,
                );
            case 'COMMENT_REPLY':
                return notificationReader.getCommentReplyNotification(
                    notificationId,
                    userId,
                    role,
                );
            case 'ANSWER_REPLY_REPLY':
                return notificationReader.getAnswerReplyReplyNotification(
                    notificationId,
                    userId,
                    role,
                );
            case 'COMMENT_REPLY_REPLY':
                return notificationReader.getCommentReplyReplyNotification(
                    notificationId,
                    userId,
                    role,
                );
            case 'COMMENT':
                return notificationReader.getCommentNotification(
                    notificationId,
                );
            case 'ANSWER':
                return notificationReader.getAnswerNotification(notificationId);
            case 'POST_LIKE':
                return notificationReader.getPostLikeNotification(
                    notificationId,
                );
            case 'QUESTION_LIKE':
                return notificationReader.getQuestionLikeNotification(
                    notificationId,
                );
            case 'POST_APPROVAL':
                return notificationReader.getPostApprovalNotification(
                    notificationId,
                );
            case 'QUESTION_APPROVAL':
                return notificationReader.getQuestionApprovalNotification(
                    notificationId,
                );
            case 'POST_REJECTION':
                return notificationReader.getPostRejectionNotification(
                    notificationId,
                );
            case 'QUESTION_REJECTION':
                return notificationReader.getQuestionRejectionNotification(
                    notificationId,
                );
            default:
                return null;
        }
    }
}

export default new NotificationService();
