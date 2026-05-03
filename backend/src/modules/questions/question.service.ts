import { prisma } from '../../lib/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import {
    FormattedHomeQuestion,
    PopularQuestion,
} from '../../types/question.js';

class QuestionService {
    // 2. Cache State Variables
    private cachedHomeQuestions: FormattedHomeQuestion[] = [];
    private homeQuestionsExpiresAt = 0;
    private homeQuestionsRefreshPromise: Promise<void> | null = null;

    // 1 Hour TTL (since homepage questions rarely change minute-to-minute)
    private readonly HOME_QUESTIONS_TTL = 1000 * 60 * 60;

    private cachedPopularQuestions: PopularQuestion[] = [];
    private popularQuestionsExpiresAt = 0;
    private popularQuestionsRefreshPromise: Promise<void> | null = null;

    // 15 Minutes TTL
    private readonly POPULAR_QUESTIONS_TTL = 1000 * 60 * 15;

    async createQuestion(
        title: string,
        content: string,
        tags: string[],
        userId: string,
        role: 'ADMIN' | 'USER' | null = null,
    ) {
        if (!tags || tags.length === 0) {
            throw new Error('Must have at least 1 tag');
        }

        if (tags.length > 10) {
            throw new Error('Max 10 tags');
        }

        // -------------------------
        // 2. Normalize + dedupe
        // -------------------------
        const tagMap = new Map<string, string>();

        for (const tag of tags) {
            if (typeof tag !== 'string') {
                throw new Error('Invalid tag');
            }

            const trimmed = tag.trim();
            if (!trimmed) continue;

            if (trimmed.length > 30) {
                throw new Error('Tag too long (max 30)');
            }

            const normalized = normalizeArabic(trimmed).toLowerCase();

            // dedupe AFTER normalization
            if (!tagMap.has(normalized)) {
                tagMap.set(normalized, trimmed);
            }
        }

        const normalizedTags = Array.from(tagMap.keys());

        if (normalizedTags.length === 0) {
            throw new Error('No valid tags');
        }

        const titleNormalized = normalizeArabic(title);

        // -------------------------
        // 3. Transaction
        // -------------------------
        return await prisma.$transaction(async (tx) => {
            // ensure global tags exist
            await tx.tag.createMany({
                data: normalizedTags.map((n) => ({ normalizedName: n })),
                skipDuplicates: true,
            });

            // fetch tag IDs (authoritative state)
            const tagRecords = await tx.tag.findMany({
                where: { normalizedName: { in: normalizedTags } },
                select: { id: true, normalizedName: true },
            });

            const tagIdMap = new Map(
                tagRecords.map((t) => [t.normalizedName, t.id]),
            );

            // create question
            const question = await tx.question.create({
                data: {
                    ...(role === 'ADMIN' ? { status: 'APPROVED' } : {}),
                    title: title.trim(),
                    titleNormalized,
                    content: content.trim(),
                    authorId: userId,
                },
            });

            // build relations safely
            const relations = normalizedTags.map((n) => {
                const tagId = tagIdMap.get(n);

                if (tagId === undefined) {
                    throw new Error(
                        `Invariant failed: missing tagId for "${n}"`,
                    );
                }

                return {
                    questionId: question.id,
                    tagId,
                    name: tagMap.get(n)!, // original user input
                };
            });

            // bulk insert relations
            await tx.questionTag.createMany({
                data: relations,
            });

            return question;
        });
    }

    async getQuestions(
        sort: string,
        cursor: string | null = null,
        search: string = '',
        status: string = 'APPROVED',
    ) {
        const take = 10;

        const where: any = {
            status: status.toUpperCase(),
        };

        if (search && search.trim() !== '') {
            const searchQuery = normalizeArabic(search);

            const words = searchQuery
                .split(' ')
                .filter((word) => word.length > 0);

            where.OR = [
                ...words.map((word) => ({
                    titleNormalized: {
                        contains: word,
                    },
                })),

                {
                    tags: {
                        some: {
                            tag: {
                                normalizedName: {
                                    equals: searchQuery,
                                },
                            },
                        },
                    },
                },
            ];
        }

        const orderBy =
            sort === 'popular'
                ? [{ answersCount: 'desc' as const }, { id: 'desc' as const }]
                : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

        const questions = await prisma.question.findMany({
            where,
            orderBy,
            take,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            select: {
                id: true,
                title: true,
                content: true,

                likesCount: true,
                answersCount: true,

                createdAt: true,
                tags: {
                    take: 4,
                    select: { name: true },
                },

                author: {
                    select: {
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
            },
        });

        const hasMore = questions.length === take;

        const nextCursor = hasMore ? questions[questions.length - 1].id : null;

        const data = questions.map((question) => ({
            id: question.id,
            title: question.title,
            content: question.content.slice(0, 280),

            likesCount: question.likesCount,
            answersCount: question.answersCount,

            publishDate: question.createdAt,

            tags: question.tags,

            author: {
                name: question.author.name,
                avatar: question.author.avatar,

                tierName: question.author.tier?.name ?? null,
                badgeColor: question.author.tier?.badgeColor ?? null,
            },
        }));

        return {
            questions: data,
            nextCursor,
            hasMore,
        };
    }

    async getQuestionById(
        questionId: string,
        userId: string | null = null,
        role: 'ADMIN' | 'USER' | null = null,
    ) {
        const question = await prisma.question.findFirst({
            where: {
                id: questionId,
                ...(role === 'ADMIN' ? {} : { status: 'APPROVED' }),
            },
            select: {
                id: true,
                status: true,
                title: true,
                content: true,
                createdAt: true,

                tags: {
                    select: {
                        name: true,
                    },
                },
                likesCount: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
                answersCount: true,
                ...(userId && {
                    likes: {
                        where: { userId },
                        select: { userId: true },
                    },
                }),
            },
        });
        if (!question) {
            throw new Error('question_NOT_FOUND');
        }

        const likedByMe =
            userId && 'likes' in question ? question.likes.length > 0 : false;

        return {
            id: question.id,
            ...(role === 'ADMIN' && { status: question.status }),
            title: question?.title,
            content: question?.content,
            publishDate: question?.createdAt,
            author: {
                id: question?.author.id,
                name: question?.author.name,
                avatar: question?.author.avatar,
                tierName: question?.author.tier?.name ?? null,
                badgeColor: question?.author.tier?.badgeColor ?? null,
            },
            tags: question?.tags,
            likesCount: question?.likesCount,
            answersCount: question?.answersCount,
            likedByMe,
        };
    }

    async deleteQuestionById(
        questionId: string,
        userId: string,
        role: 'ADMIN' | 'USER' | null = null,
    ) {
        const question = await prisma.question.findFirst({
            where: {
                id: questionId,
                ...(role === 'ADMIN' ? {} : { authorId: userId }),
            },
            select: {
                id: true,

                tags: {
                    select: {
                        tagId: true,
                    },
                },
            },
        });

        if (!question) {
            throw new Error('question_NOT_FOUND');
        }

        const tagIds = question.tags.map((tag) => tag.tagId);

        await prisma.$transaction(async (tx) => {
            await tx.question.delete({
                where: {
                    id: question.id,
                },
            });

            if (tagIds.length > 0) {
                await tx.tag.deleteMany({
                    where: {
                        id: {
                            in: tagIds,
                        },
                        questions: {
                            none: {},
                        },
                    },
                });
            }
        });

        return true;
    }

    // 3. The Background Refresh Logic
    private async refreshHomeQuestionsCache() {
        const rows = await prisma.homeQuestion.findMany({
            orderBy: { position: 'asc' },
            select: { questionId: true },
        });

        const ids = rows.map((row) => row.questionId);

        if (ids.length === 0) {
            this.cachedHomeQuestions = [];
            this.homeQuestionsExpiresAt = Date.now() + this.HOME_QUESTIONS_TTL;
            return;
        }

        const rawQuestions = await prisma.question.findMany({
            where: {
                id: { in: ids },
                status: 'APPROVED',
            },
            select: {
                id: true,
                title: true,
                content: true,
                tags: { take: 4, select: { name: true } },
                author: {
                    select: {
                        name: true,
                        avatar: true,
                        tier: { select: { name: true, badgeColor: true } },
                    },
                },
                likesCount: true,
                answersCount: true,
                answers: {
                    orderBy: { totalVoteValue: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        totalVoteValue: true,
                        author: {
                            select: {
                                name: true,
                                avatar: true,
                                tier: {
                                    select: { name: true, badgeColor: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Map to preserve exact ordering from the HomeQuestion table
        const questionMap: Record<string, any> = {};
        for (const question of rawQuestions) {
            questionMap[question.id] = question;
        }

        this.cachedHomeQuestions = ids
            .map((id) => questionMap[id])
            .filter(Boolean)
            .map((question) => ({
                id: question.id,
                title: question.title,
                content: question.content.slice(0, 280),
                likesCount: question.likesCount,
                answersCount: question.answersCount,
                tags: question.tags,
                author: {
                    name: question.author.name,
                    avatar: question.author.avatar,
                    tierName: question.author.tier?.name ?? null,
                    badgeColor: question.author.tier?.badgeColor ?? null,
                },
                topAnswer: question.answers[0]
                    ? {
                          id: question.answers[0].id,
                          content: question.answers[0].content.slice(0, 280),
                          totalVoteValue: question.answers[0].totalVoteValue,
                          author: question.answers[0].author,
                      }
                    : null,
            }));

        // Jitter to prevent stampedes across multiple caches expiring exactly together
        const jitter = Math.floor(Math.random() * 1000 * 60 * 5);
        this.homeQuestionsExpiresAt =
            Date.now() + this.HOME_QUESTIONS_TTL + jitter;
    }

    // 4. Manual Invalidation Hook (Call this from Admin panel on update)
    invalidateHomeQuestionsCache() {
        this.homeQuestionsExpiresAt = 0;
    }

    // 5. The Hot Path API
    async getHomeQuestions() {
        const now = Date.now();

        if (now > this.homeQuestionsExpiresAt) {
            if (!this.homeQuestionsRefreshPromise) {
                this.homeQuestionsRefreshPromise =
                    this.refreshHomeQuestionsCache()
                        .catch((e) =>
                            console.error(
                                'Home questions cache refresh failed:',
                                e,
                            ),
                        )
                        .finally(
                            () => (this.homeQuestionsRefreshPromise = null),
                        );
            }

            // Cold start protection: Only block if the cache is completely empty
            if (this.cachedHomeQuestions.length === 0) {
                await this.homeQuestionsRefreshPromise;
            }
        }

        // Always return a consistent object shape
        return { questions: this.cachedHomeQuestions };
    }

    private async refreshPopularQuestionsCache() {
        // Fetch exactly 10. This covers the max limit for the whole app.
        const questions = await prisma.question.findMany({
            where: {
                status: 'APPROVED',
            },
            orderBy: {
                answersCount: 'desc',
            },
            take: 10,
            select: {
                id: true,
                title: true,
                answersCount: true,
            },
        });

        this.cachedPopularQuestions = questions;

        const jitter = Math.floor(Math.random() * 1000 * 15);
        this.popularQuestionsExpiresAt =
            Date.now() + this.POPULAR_QUESTIONS_TTL + jitter;
    }

    invalidatePopularQuestionsCache() {
        this.popularQuestionsExpiresAt = 0;
    }

    async getPopularQuestions(limit: number = 10) {
        const now = Date.now();

        if (now > this.popularQuestionsExpiresAt) {
            if (!this.popularQuestionsRefreshPromise) {
                this.popularQuestionsRefreshPromise =
                    this.refreshPopularQuestionsCache()
                        .catch((e) =>
                            console.error(
                                'Popular questions cache refresh failed:',
                                e,
                            ),
                        )
                        .finally(
                            () => (this.popularQuestionsRefreshPromise = null),
                        );
            }

            if (this.cachedPopularQuestions.length === 0) {
                await this.popularQuestionsRefreshPromise;
            }
        }

        const safeLimit = Math.min(limit, 10);

        return this.cachedPopularQuestions.slice(0, safeLimit);
    }
}

export default new QuestionService();
