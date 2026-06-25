import { prisma } from '../../lib/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import { TrendingTag } from '../../types/tag.js';

class TagService {
    // 2. Cache State Variables
    private cachedTrendingTags: TrendingTag[] = [];
    private trendingTagsExpiresAt = 0;
    private trendingTagsRefreshPromise: Promise<void> | null = null;

    // 15 Minutes TTL (Keep it fresh, but protect the DB)
    private readonly TRENDING_TAGS_TTL = 1000 * 60 * 15;

    // 3. The Background Refresh Logic
    private async refreshTrendingTagsCache() {
        const maxLimit = 10;

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
            maxLimit,
        );

        this.cachedTrendingTags = (result as any[]).map((tag) => ({
            name: tag.name,
            postsCount: Number(tag.postsCount),
        }));

        // 15 minutes TTL + up to 1 minute of jitter
        const jitter = Math.floor(Math.random() * 1000 * 60);
        this.trendingTagsExpiresAt =
            Date.now() + this.TRENDING_TAGS_TTL + jitter;
    }

    public invalidateTrendingTagsCache() {
        this.trendingTagsExpiresAt = 0;
    }

    public async getTrendingTags(limit: number = 10) {
        const now = Date.now();

        if (now > this.trendingTagsExpiresAt) {
            if (!this.trendingTagsRefreshPromise) {
                this.trendingTagsRefreshPromise =
                    this.refreshTrendingTagsCache()
                        .catch((e) =>
                            console.error(
                                'Trending tags cache refresh failed:',
                                e,
                            ),
                        )
                        .finally(
                            () => (this.trendingTagsRefreshPromise = null),
                        );
            }

            // Cold start protection
            if (this.cachedTrendingTags.length === 0) {
                await this.trendingTagsRefreshPromise;
            }
        }

        const safeLimit = Math.min(limit, 10);

        // Instantly return the sliced array from RAM
        return this.cachedTrendingTags.slice(0, safeLimit);
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
