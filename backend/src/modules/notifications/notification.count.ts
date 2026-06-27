import { prisma } from '../../lib/client.js';

class NotificationCount {
    async getUnreadNotificationCount(userId: string) {
        const [notifications, requests] = await Promise.all([
            prisma.notification.findMany({
                where: {
                    recipientId: userId,
                    isRead: false,
                },
                select: {
                    id: true,
                },
                take: 100,
            }),
            prisma.contactRequest.findMany({
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
                take: 100,
            }),
        ]);

        const notificationCount: number = notifications.length;
        const requestCount: number = requests.length;

        const notificationIsCapped: boolean = notificationCount >= 100;
        const requestIsCapped: boolean = requestCount >= 100;

        const totalCount: number = notificationCount + requestCount;

        return {
            total: {
                count: Math.min(totalCount, 99),
                isCapped: totalCount >= 100,
            },
            notifications: {
                count: Math.min(notificationCount, 99),
                isCapped: notificationIsCapped,
            },
            contactRequests: {
                count: Math.min(requestCount, 99),
                isCapped: requestIsCapped,
            },
        };
    }
}

export default new NotificationCount();
