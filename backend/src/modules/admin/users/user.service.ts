import { prisma } from '../../../lib/client.js';
import socketService from '../../../sockets/socket.service.js';
import NotificationService from '../../notifications/notification.service.js';

class UserService {
    notificationService = NotificationService;

    async getUsers(
        status: 'active' | 'banned' = 'banned',
        cursor: string | null = null,
    ) {
        const pageSize = 10;
        const isBanned = status === 'banned';

        const users = await prisma.user.findMany({
            where: isBanned
                ? {
                      role: 'USER',
                      ban: {
                          isNot: null,
                      },
                  }
                : {
                      role: 'USER',
                      ban: null,
                  },

            take: pageSize + 1,

            ...(cursor && {
                skip: 1,
                cursor: {
                    id: cursor,
                },
            }),

            orderBy: isBanned
                ? [
                      {
                          ban: {
                              createdAt: 'desc',
                          },
                      },
                      {
                          id: 'desc',
                      },
                  ]
                : [
                      {
                          createdAt: 'desc',
                      },
                      {
                          id: 'desc',
                      },
                  ],

            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                tier: {
                    select: {
                        id: true,
                        name: true,
                        badgeColor: true,
                    },
                },

                ban: isBanned
                    ? {
                          select: {
                              reason: true,
                              bannedBy: {
                                  select: {
                                      id: true,
                                      name: true,
                                      email: true,
                                  },
                              },
                              createdAt: true,
                          },
                      }
                    : false,
            },
        });

        const hasMore = users.length > pageSize;

        if (hasMore) {
            users.pop();
        }

        const nextCursor = hasMore ? users[users.length - 1].id : null;

        return {
            users,
            nextCursor,
            hasMore,
        };
    }

    async banUser(userId: string, reason: string, adminId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        if (user.role === 'ADMIN') {
            throw new Error('CANNOT_BAN_ADMIN');
        }

        try {
            const ban = await prisma.$transaction(async (tx) => {
                const ban = await tx.ban.create({
                    data: {
                        userId,
                        bannedById: adminId,
                        reason,
                    },
                });

                await tx.refreshToken.deleteMany({
                    where: {
                        userId,
                    },
                });

                return ban;
            });
            socketService.emitForceLogout(userId, reason);

            return { banned: true, ban };
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('USER_ALREADY_BANNED');
            }

            throw error;
        }
    }

    async unbanUser(userId: string) {
        try {
            await prisma.ban.delete({
                where: {
                    userId,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new Error('USER_NOT_BANNED');
            }
            throw error;
        }
    }

    async updateUserTier(userId: string, tierId: number, adminId: string) {
        // get current user tier
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
                role: 'USER',
                ban: null,
            },
            select: {
                tierId: true,
            },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        // no change
        if (user.tierId === tierId) {
            throw new Error('USER_ALREADY_HAS_THIS_TIER');
        }

        // check target tier
        const tier = await prisma.tier.findUnique({
            where: {
                id: tierId,
            },
            select: {
                id: true,
                isSystem: true,
            },
        });

        if (!tier || tier.isSystem) {
            throw new Error('TIER_NOT_FOUND');
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
                role: 'USER',
                ban: null,
            },
            data: {
                tier: {
                    connect: {
                        id: tierId,
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                createdAt: true,
                tier: {
                    select: {
                        id: true,
                        name: true,
                        badgeColor: true,
                        description: true,
                    },
                },
            },
        });

        // notify only on upgrades
        if (tierId > user.tierId) {
            await this.notificationService.createTierUpgradeNotification({
                recipientId: userId,
                oldTierId: user.tierId,
                newTierId: tierId,
                actorId: adminId,
            });
        }

        return updatedUser;
    }
}

export default new UserService();
