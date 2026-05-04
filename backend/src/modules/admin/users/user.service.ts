import { prisma } from '../../../lib/client.js';
import socketService from '../../../sockets/socket.service.js';

class UserService {
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
            await prisma.$transaction(async (tx) => {
                await tx.ban.create({
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
            });
            socketService.emitForceLogout(userId, reason);

            return { banned: true };
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
            return { unbanned: true };
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new Error('USER_NOT_BANNED');
            }
            throw error;
        }
    }
}

export default new UserService();
