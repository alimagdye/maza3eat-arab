import { prisma } from '../../prisma/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';

class TagService {
    async getTrendingTags(limit: number = 10) {
        const result = await prisma.$queryRawUnsafe(
            `
            SELECT
                t."normalizedName",
                MIN(pt.name) as name,
                COUNT(DISTINCT pt."postId") as "postsCount"
            FROM "PostTag" pt
            JOIN "Post" p ON p.id = pt."postId"
            JOIN "Tag" t ON t.id = pt."tagId"
            WHERE p.status = 'APPROVED'
            GROUP BY t."normalizedName"
            ORDER BY "postsCount" DESC
            LIMIT $1
            `,
            limit,
        );

        return (result as any[]).map((tag) => ({
            name: tag.name,
            postsCount: Number(tag.postsCount),
        }));
    }

    async suggestTags(query: string) {
        const normalized = normalizeArabic(query);

        return prisma.postTag.findMany({
            where: {
                tag: {
                    normalizedName: {
                        startsWith: normalized,
                    },
                },
            },
            distinct: ['tagId'],
            take: 10,
            select: {
                tagId: true,
                name: true,
            },
        });
    }
}

export default new TagService();
