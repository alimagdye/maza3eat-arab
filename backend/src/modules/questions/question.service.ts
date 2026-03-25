import { prisma } from '../../prisma/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import { HomeScope } from '@prisma/client/wasm.js';

class QuestionService {
    async createQuestion(
        title: string,
        content: string,
        tags: string[],
        userId: string,
    ) {
        if (!tags || tags.length < 1) {
            throw new Error('question must have at least 1 tag');
        }

        if (tags.length > 10) {
            throw new Error('Max 10 tags');
        }

        return prisma.$transaction(async (tx) => {
            const newQuestion = await tx.question.create({
                data: {
                    title,
                    titleNormalized: normalizeArabic(title),
                    content,
                    authorId: userId,
                },
            });

            const uniqueOriginalTags = [
                ...new Set(tags.map((tag) => tag.trim()).filter(Boolean)),
            ];

            const normalizedList = uniqueOriginalTags.map((tag) =>
                normalizeArabic(tag),
            );

            const existing = await tx.tag.findMany({
                where: {
                    normalizedName: {
                        in: normalizedList,
                    },
                },
                select: {
                    id: true,
                    normalizedName: true,
                },
            });

            const tagIdByNormalized = new Map(
                existing.map((tag) => [tag.normalizedName, tag.id]),
            );

            const missing = normalizedList
                .filter((n) => !tagIdByNormalized.has(n))
                .map((n) => ({
                    normalizedName: n,
                }));

            if (missing.length > 0) {
                await tx.tag.createMany({
                    data: missing,
                    skipDuplicates: true,
                });

                const created = await tx.tag.findMany({
                    where: {
                        normalizedName: {
                            in: missing.map((m) => m.normalizedName),
                        },
                    },
                    select: {
                        id: true,
                        normalizedName: true,
                    },
                });

                for (const tag of created) {
                    tagIdByNormalized.set(tag.normalizedName, tag.id);
                }
            }

            await tx.questionTag.createMany({
                data: uniqueOriginalTags.map((original) => {
                    const normalized = normalizeArabic(original);

                    return {
                        questionId: newQuestion.id,
                        tagId: tagIdByNormalized.get(normalized)!,
                        name: original,
                    };
                }),
            });

            return newQuestion;
        });
    }

    async getQuestions(
        sort: string,
        cursor: string | null = null,
        search: string = '',
    ) {
        const take = 5;

        const where: any = {
            status: 'APPROVED',
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

            console.log(where.OR);
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

    async getQuestionById(questionId: string, userId: string | null = null) {
        const question = await prisma.question.findFirst({
            where: { id: questionId, status: 'APPROVED' },
            select: {
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
            title: question?.title,
            content: question?.content,
            publishDate: question?.createdAt,
            author: {
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

    async deleteQuestionById(questionId: string, userId: string) {
        const question = await prisma.question.findFirst({
            where: {
                id: questionId,
                authorId: userId,
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

    async getHomeQuestions() {
        const rows = await prisma.homeQuestion.findMany({
            orderBy: { position: 'asc' },
            select: {
                questionId: true,
            },
        });

        const ids: string[] = rows.map(
            (row: { questionId: string }) => row.questionId,
        );

        if (ids.length === 0) return [];

        let questions: any[] = await prisma.question.findMany({
            where: {
                id: { in: ids },
                status: 'APPROVED',
            },

            select: {
                id: true,
                title: true,
                content: true,
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
                                    select: {
                                        name: true,
                                        badgeColor: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const questionMap: { [key: string]: any } = {};

        for (const question of questions) {
            questionMap[question.id] = question;
        }

        questions = ids.map((id) => questionMap[id]).filter(Boolean);

        questions = questions.map((question) => ({
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

        return { questions };
    }

    async getPopularQuestions(limit: number = 10) {
        const questions = await prisma.question.findMany({
            where: {
                status: 'APPROVED',
            },
            orderBy: {
                answersCount: 'desc',
            },
            take: limit,
            select: {
                id: true,
                title: true,
                answersCount: true,
            },
        });

        return questions;
    }
}

export default new QuestionService();
