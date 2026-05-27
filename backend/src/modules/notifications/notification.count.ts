import { prisma } from '../../lib/client.js';

class NotificationCount {
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

export default new NotificationCount();
