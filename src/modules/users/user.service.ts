import { prisma } from '../../lib/client.js';

class UserService {
    async getMyProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
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

        if (!user) {
            return null;
        }

        return {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
            tier: user.tier,
        };
    }
    async getUserById(userId: string, authUserId: string | null = null) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
                tier: {
                    select: {
                        id: true,
                        name: true,
                        badgeColor: true,
                        description: true,
                    },
                },
                _count: {
                    select: {
                        posts: {
                            where: {
                                status: 'APPROVED',
                            },
                        },
                        questions: {
                            where: {
                                status: 'APPROVED',
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return null;
        }

        const isOwner = authUserId === userId;

        return {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            ...(isOwner && { role: user.role }),
            tier: user.tier,
            counts: {
                posts: user._count.posts,
                questions: user._count.questions,
            },

            permissions: {
                canEditProfile: isOwner,
            },
        };
    }

    async getUserPosts(
        userId: string,
        cursor: string | null = null,
        authUserId: string | null = null,
        role: 'ADMIN' | 'USER' | 'MODERATOR' | null = null,
    ) {
        const take = 10;
        const posts = await prisma.post.findMany({
            where: {
                authorId: userId,
                ...(authUserId === userId ? {} : { status: 'APPROVED' }),
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            select: {
                id: true,
                status: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
                title: true,
                content: true,

                likesCount: true,
                commentsCount: true,

                createdAt: true,
                tags: {
                    take: 4,
                    select: { name: true },
                },

                images: {
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                    select: {
                        imageUrl: true,
                        originalName: true,
                    },
                },

                _count: {
                    select: {
                        images: true,
                    },
                },
            },
        });

        const isOwner = authUserId === userId;

        const hasMore = posts.length === take;

        const nextCursor = hasMore ? posts[posts.length - 1].id : null;

        const data = posts.map((post) => ({
            id: post.id,
            author: post.author,
            title: post.title,
            content: post.content.slice(0, 450),
            status: post.status,

            likesCount: post.likesCount,
            commentsCount: post.commentsCount,

            publishDate: post.createdAt,

            tags: post.tags,

            image: {
                url: post.images[0]?.imageUrl ?? null,
                name: post.images[0]?.originalName ?? null,
                remainingImages: Math.max(post._count.images - 1, 0),
            },

            permissions: {
                canDelete:
                    (isOwner && post.status !== 'PENDING') ||
                    role === 'ADMIN' ||
                    role === 'MODERATOR',
            },
        }));

        return {
            posts: data,
            nextCursor,
            hasMore,
        };
    }

    async getUserQuestions(
        userId: string,
        cursor: string | null,
        authUserId: string | null = null,
        role: 'ADMIN' | 'USER' | 'MODERATOR' | null = null,
    ) {
        const take = 10;
        const questions = await prisma.question.findMany({
            where: {
                authorId: userId,
                ...(authUserId === userId ? {} : { status: 'APPROVED' }),
            },
            orderBy: { createdAt: 'desc' },
            take,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            select: {
                id: true,
                status: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        tier: {
                            select: {
                                id: true,
                                name: true,
                                badgeColor: true,
                            },
                        },
                    },
                },
                title: true,
                content: true,

                likesCount: true,
                answersCount: true,

                createdAt: true,
                tags: {
                    take: 4,
                    select: { name: true },
                },
            },
        });

        const isOwner = authUserId === userId;

        const hasMore = questions.length === take;

        const nextCursor = hasMore ? questions[questions.length - 1].id : null;

        const data = questions.map((question) => ({
            id: question.id,
            author: question.author,
            status: question.status,
            title: question.title,
            content: question.content.slice(0, 280),

            likesCount: question.likesCount,
            answersCount: question.answersCount,

            publishDate: question.createdAt,

            tags: question.tags,
            permissions: {
                canDelete:
                    (isOwner && question.status !== 'PENDING') ||
                    role === 'ADMIN' ||
                    role === 'MODERATOR',
            },
        }));

        return {
            questions: data,
            nextCursor,
            hasMore,
        };
    }
}

export default new UserService();
