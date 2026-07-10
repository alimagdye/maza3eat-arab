import { prisma } from '../../../lib/client.js';
import socketService from './../../../sockets/socket.service.js';

class AnnouncementService {
    async createAnnouncement(message: string, userId: string) {
        const announcement = await prisma.notification.create({
            data: {
                type: 'ADMIN_ANNOUNCEMENT',
                recipientId: null,
                lastActorId: userId,

                adminNotification: {
                    create: {
                        message,
                    },
                },
            },

            select: {
                id: true,
                type: true,
                createdAt: true,
                lastActor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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
                adminNotification: {
                    select: {
                        id: true,
                        message: true,
                    },
                },
            },
        });

        socketService.emitGlobalNotification();

        return announcement;
    }

    async getAnnouncements(cursor: string | null) {
        const take = 10;

        const announcements = await prisma.notification.findMany({
            take: take + 1,

            ...(cursor && {
                skip: 1,
                cursor: {
                    id: cursor,
                },
            }),
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            where: {
                type: 'ADMIN_ANNOUNCEMENT',
            },

            select: {
                id: true,
                type: true,
                createdAt: true,
                lastActor: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
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

                adminNotification: {
                    select: {
                        id: true,
                        message: true,
                    },
                },
            },
        });

        const hasMore = announcements.length > take;
        if (hasMore) announcements.pop();

        const nextCursor = hasMore
            ? announcements[announcements.length - 1].id
            : null;

        const result = announcements.map((announcement) => {
            return {
                id: announcement.id,
                type: announcement.type,
                createdAt: announcement.createdAt,
                author: announcement.lastActor,
                message: announcement.adminNotification?.message,
            };
        });

        return {
            announcements: result,
            nextCursor,
            hasMore,
        };
    }
}

export default new AnnouncementService();
