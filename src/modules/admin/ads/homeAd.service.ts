import { prisma } from '../../../lib/client.js';

enum HomeAdPosition {
    TOP = 'TOP',
    MIDDLE = 'MIDDLE',
    BOTTOM = 'BOTTOM',
}

class HomeAdService {
    async createHomeAd(adId: string, adPosition: string) {
        const homeAd = await prisma.homeAd.create({
            data: {
                adId,
                position: adPosition.toUpperCase() as HomeAdPosition,
            },
            include: {
                ad: true,
            },
        });
        const now = new Date();

        return {
            ...homeAd,
            ad: {
                ...homeAd.ad,
                isExpired: homeAd.ad.expireAt < now,
            },
        };
    }

    async getHomeAds() {
        const homeAds = await prisma.homeAd.findMany({
            include: {
                ad: true,
            },
        });

        const now = new Date();
        return homeAds.map((homeAd) => ({
            ...homeAd,
            ad: {
                ...homeAd.ad,
                isExpired: homeAd.ad.expireAt < now,
            },
        }));
    }

    async updateHomeAd(homeAdId: string, adId: string) {
        const homeAd = await prisma.homeAd.findUnique({
            where: {
                id: homeAdId,
            },
        });

        if (!homeAd) {
            throw new Error('HOME_AD_NOT_FOUND');
        }

        const ad = await prisma.ad.findUnique({
            where: {
                id: adId,
            },
        });

        if (!ad) {
            throw new Error('AD_NOT_FOUND');
        }

        const updatedHomeAd = await prisma.homeAd.update({
            where: {
                id: homeAdId,
            },
            data: {
                adId,
            },
            include: {
                ad: true,
            },
        });

        const now = new Date();

        return {
            ...updatedHomeAd,
            ad: {
                ...updatedHomeAd.ad,
                isExpired: updatedHomeAd.ad.expireAt < now,
            },
        };
    }

    async deleteHomeAd(id: string) {
        return await prisma.homeAd.delete({
            where: { id },
        });
    }
}

export default new HomeAdService();
