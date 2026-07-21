import { UserRole } from '@prisma/client';
import { prisma } from '../../../lib/client.js';

class ModeratorService {
    private PAGE_SIZE = 20;

    private TIER = {
        BEGINNER: 1,
        MODERATOR: 8,
        ADMIN: 9,
        DEVELOPER: 7,
    };

    async getModerators(cursor: string | null) {
        const moderators = await prisma.user.findMany({
            where: {
                role: UserRole.MODERATOR,
                ban: null,
            },
            select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                role: true,
                tier: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },

            take: this.PAGE_SIZE + 1,

            ...(cursor && {
                skip: 1,
                cursor: {
                    id: cursor,
                },
            }),
        });

        const hasMore = moderators.length > this.PAGE_SIZE;

        if (hasMore) {
            moderators.pop();
        }

        const nextCursor = hasMore
            ? moderators[moderators.length - 1].id
            : null;

        return {
            moderators,
            nextCursor,
            hasMore,
        };
    }

    async promoteToModerator(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
            },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        if (user.role === UserRole.ADMIN) {
            throw new Error('CANNOT_PROMOTE_ADMIN');
        }

        if (user.role === UserRole.MODERATOR) {
            throw new Error('USER_ALREADY_PROMOTED');
        }

        return prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.MODERATOR,
                tierId: this.TIER.MODERATOR,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
                tierId: true,
                createdAt: true,
            },
        });
    }

    async demoteModerator(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                role: true,
            },
        });

        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }

        if (user.role === UserRole.ADMIN) {
            throw new Error('CANNOT_DEMOTE_ADMIN');
        }

        if (user.role !== UserRole.MODERATOR) {
            throw new Error('USER_NOT_MODERATOR');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                role: UserRole.USER,
                tierId: this.TIER.BEGINNER,
            },
        });
    }
}

export default new ModeratorService();
