import { prisma } from '../../lib/client.js';

class UserService {
    async getUserById(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                avatar: true,
                tier: {
                    select: {
                        name: true,
                        badgeColor: true,
                        description: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                        questions: true,
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
            tier: user.tier,
            counts:{
                posts: user._count.posts,
                questions: user._count.questions,
            }
        };
    }

    async getUserPosts(userId: string, cursor: string | null = null) {
        const take = 10;
        const posts = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
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

        const hasMore = posts.length === take;

        const nextCursor = hasMore ? posts[posts.length - 1].id : null;

        const data = posts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content.slice(0, 450),

            likesCount: post.likesCount,
            commentsCount: post.commentsCount,

            publishDate: post.createdAt,

            tags: post.tags,

            image: {
                url: post.images[0]?.imageUrl ?? null,
                name: post.images[0]?.originalName ?? null,
                remainingImages: Math.max(post._count.images - 1, 0),
            },
        }));

        return {
            posts: data,
            nextCursor,
            hasMore,
        };
    }

    async getUserQuestions(userId: string, cursor: string | null) {
        const take = 10;
        const questions = await prisma.question.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: 'desc' },
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
        }));

        return {
            questions: data,
            nextCursor,
            hasMore,
        };
    }
}

export default new UserService();
