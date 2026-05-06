import { prisma } from '../../../lib/client.js';

class TierService {
    async createTier(name: string, description: string, badgeColor: string) {
        try {
            return await prisma.tier.create({
                data: {
                    name,
                    description,
                    badgeColor,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('TIER_ALREADY_EXISTS');
            }

            throw error;
        }
    }

    async getTiers() {
        return prisma.tier.findMany({
            where: {
                isSystem: false,
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async updateTier(
        id: number,
        name: string,
        description: string,
        badgeColor: string,
    ) {
        try {
            return await prisma.tier.update({
                where: { id, isSystem: false },
                data: {
                    name,
                    description,
                    badgeColor,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new Error('TIER_NOT_FOUND');
            }

            if (error.code === 'P2002') {
                throw new Error('TIER_ALREADY_EXISTS');
            }

            throw error;
        }
    }

    async deleteTier(id: number) {
        try {
            const tier = await prisma.tier.findUnique({
                where: { id },
                select: {
                    name: true,
                },
            });

            if (!tier) {
                throw new Error('TIER_NOT_FOUND');
            }

            if (tier.name === 'Beginner') {
                throw new Error('CANNOT_DELETE_DEFAULT_TIER');
            }

            await prisma.tier.delete({
                where: { id },
            });

            return true;
        } catch (error: any) {
            if (error.code === 'P2003') {
                throw new Error('TIER_IN_USE');
            }

            throw error;
        }
    }
}

export default new TierService();
