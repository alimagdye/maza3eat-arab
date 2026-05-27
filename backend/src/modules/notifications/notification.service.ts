import { prisma } from '../../lib/client.js';
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
    // counter
    getUnreadNotificationCount =
        notificationCount.getUnreadNotificationCount.bind(notificationCount);

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
                return notificationReader.getAnswerReplyNotification(
                    notificationId,
                );
            case 'COMMENT_REPLY':
                return notificationReader.getCommentReplyNotification(
                    notificationId,
                );
            case 'ANSWER_REPLY_REPLY':
                return notificationReader.getAnswerReplyReplyNotification(
                    notificationId,
                );
            case 'COMMENT_REPLY_REPLY':
                return notificationReader.getCommentReplyReplyNotification(
                    notificationId,
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
            default:
                return null;
        }
    }
}

export default new NotificationService();
