import { prisma } from '../../../lib/client.js';
import imageUtils from '../../../utils/image.utils.js';

interface AdBody {
    title: string;
    text: string;
    buttonText: string;
    link: string;
    amountPaid: number;
    expireAt: Date;
}

class AdService {
    calculatePriority(
        amountPaid: number,
        createdAt: Date,
        expireAt: Date,
    ): number {
        const ms = expireAt.getTime() - createdAt.getTime();
        const days = Math.max(1, ms / 86_400_000);

        const base = amountPaid / days;

        const commitmentBoost = 1 + 0.2 * Math.log(days + 1);

        return Math.max(1, Math.round(base * commitmentBoost));
    }

    async createAd(
        userId: string,
        {
            title,
            text,
            link,
            buttonText,
            amountPaid,
            expireAt,
            uploads,
        }: AdBody & {
            uploads: {
                url: string;
                publicId: string;
                width: number;
                height: number;
                originalName: string;
            }[];
        },
    ) {
        const ad = await prisma.ad.create({
            data: {
                addedById: userId,
                title,
                text,
                buttonText,
                link,
                amountPaid,
                priority: this.calculatePriority(
                    amountPaid,
                    new Date(),
                    expireAt,
                ),
                expireAt,
                imageUrl: uploads[0].url,
                imagePublicId: uploads[0].publicId,
                imageWidth: uploads[0].width,
                imageHeight: uploads[0].height,
                imageOriginalName: uploads[0].originalName,
            },
        });

        return ad;
    }

    async getAds(sort: 'expireAt' | 'priority', cursor: string | null) {
        const pageSize = 10;

        const ads = await prisma.ad.findMany({
            take: pageSize + 1,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy:
                sort === 'expireAt'
                    ? [{ expireAt: 'asc' }, { priority: 'desc' }]
                    : [{ priority: 'desc' }, { expireAt: 'asc' }],
        });

        const hasMore = ads.length > pageSize;
        if (hasMore) ads.pop();

        const nextCursor =
            ads.length === pageSize ? ads[ads.length - 1].id : null;

        const now = new Date();
        const result = ads.map((ad) => ({
            ...ad,
            isExpired: ad.expireAt < now,
        }));

        return { ads: result, nextCursor, hasMore };
    }

    async updateAd(
        id: string,
        {
            title,
            text,
            link,
            buttonText,
            amountPaid,
            expireAt,
            isActive,
            uploads,
        }: {
            title?: string;
            text?: string;
            link?: string;
            buttonText?: string;
            amountPaid?: number;
            expireAt?: Date;
            isActive?: boolean;
            uploads: {
                url?: string;
                publicId?: string;
                width?: number;
                height?: number;
                originalName?: string;
            }[];
        },
    ) {
        try {
            const ad = await prisma.ad.findUnique({
                where: { id },
                select: {
                    amountPaid: true,
                    createdAt: true,
                    expireAt: true,
                    imagePublicId: true,
                },
            });

            if (!ad) {
                throw new Error('AD_NOT_FOUND');
            }

            const publicIds = ad.imagePublicId ? [ad.imagePublicId] : [];

            if (publicIds.length > 0) {
                await imageUtils.deleteImages(publicIds);
            }

            return await prisma.ad.update({
                where: { id },
                data: {
                    title,
                    text,
                    link,
                    buttonText,
                    amountPaid,
                    expireAt,
                    isActive,
                    priority: this.calculatePriority(
                        amountPaid ? amountPaid : ad.amountPaid,
                        ad.createdAt,
                        expireAt ? expireAt : ad.expireAt,
                    ),
                    imageUrl: uploads[0]?.url,
                    imagePublicId: uploads[0]?.publicId,
                    imageWidth: uploads[0]?.width,
                    imageHeight: uploads[0]?.height,
                    imageOriginalName: uploads[0]?.originalName,
                },
            });
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('AD_ALREADY_EXISTS');
            }

            throw error;
        }
    }

    async deleteAd(id: string) {
        const ad = await prisma.ad.findUnique({
            where: { id },
            select: { imagePublicId: true },
        });

        if (!ad) {
            throw new Error('AD_NOT_FOUND');
        }

        const publicIds = ad.imagePublicId ? [ad.imagePublicId] : [];

        if (publicIds.length > 0) {
            await imageUtils.deleteImages(publicIds);
        }

        return await prisma.ad.delete({
            where: { id },
        });
    }
}

export default new AdService();
