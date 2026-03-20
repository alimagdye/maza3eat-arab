import { prisma } from '../../prisma/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import postUtils from './post.utils.js';
import { HomeScope } from '@prisma/client/wasm.js';

class PostService {
    async createPost(
        title: string,
        content: string,
        tags: string[],
        userId: string,
        uploads: {
            url: string;
            publicId: string;
            width: number;
            height: number;
            originalName: string;
        }[],
    ) {
        if (!uploads || uploads.length < 1) {
            throw new Error('Post must have at least 1 image');
        }
        if (uploads.length > 6) {
            throw new Error('Max 6 images');
        }
        if (!tags || tags.length < 1) {
            throw new Error('Post must have at least 1 tag');
        }
        if (tags.length > 10) {
            throw new Error('Max 10 tags');
        }

        const post = await prisma.$transaction(async (tx) => {
            // Create the post first to get the ID
            const newPost = await tx.post.create({
                data: {
                    title,
                    titleNormalized: normalizeArabic(title),
                    content,
                    authorId: userId,
                    status: 'PENDING',
                },
            });

            await tx.postImage.createMany({
                data: uploads.map((img) => ({
                    postId: newPost.id,
                    imageUrl: img.url,
                    publicId: img.publicId,
                    originalName: img.originalName,
                    width: img.width,
                    height: img.height,
                })),
            });

            const tagMap = new Map<string, string>();
            for (const tag of tags) {
                const original = tag.trim();

                if (!original) continue;

                const normalized = normalizeArabic(original);

                if (!tagMap.has(normalized)) {
                    tagMap.set(normalized, original);
                }
            }

            const uniqueTags = Array.from(tagMap.entries());

            await tx.postTag.createMany({
                data: uniqueTags.map(([normalized, original]) => ({
                    postId: newPost.id,
                    name: original,
                    normalizedName: normalized,
                })),
            });

            return newPost;
        });

        return post;
    }

    async getPosts(
        scope: string,
        sort: string,
        cursor: string | null = null,
        search: string = '',
    ) {
        const take = 5;

        const role = scope === 'community' ? 'USER' : 'ADMIN';

        const where: any = {
            status: 'APPROVED',
            author: { role },
        };

        if (search && search.trim() !== '') {
            const searchQuery = normalizeArabic(search);

            const words = searchQuery
                .split(' ')
                .filter((word) => word.length > 0);

            where.OR = words.flatMap((word) => [
                {
                    titleNormalized: {
                        contains: word,
                    },
                },
                {
                    tags: {
                        some: {
                            normalizedName: {
                                contains: word,
                            },
                        },
                    },
                },
            ]);
        }

        // ---------- order ----------
        const orderBy =
            sort === 'popular'
                ? [{ commentsCount: 'desc' as const }, { id: 'desc' as const }]
                : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

        const posts = await prisma.post.findMany({
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

        const hasMore = posts.length === take;

        const nextCursor = hasMore ? posts[posts.length - 1].id : null;

        const data = posts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content.slice(0, 120),

            likesCount: post.likesCount,
            commentsCount: post.commentsCount,

            publishDate: post.createdAt,

            tags: post.tags,

            image: {
                url: post.images[0]?.imageUrl ?? null,
                name: post.images[0]?.originalName ?? null,
                remainingImages: Math.max(post._count.images - 1, 0),
            },

            author: {
                name: post.author.name,
                avatar: post.author.avatar,

                tierName: post.author.tier?.name ?? null,
                badgeColor: post.author.tier?.badgeColor ?? null,
            },
        }));

        return {
            posts: data,
            nextCursor,
            hasMore,
        };
    }

    async getPostById(postId: string) {
        const post = await prisma.post.findFirst({
            where: { id: postId, status: 'APPROVED' },
            select: {
                title: true,
                content: true,
                createdAt: true,
                images: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                    select: {
                        imageUrl: true,
                        originalName: true,
                    },
                },
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
                commentsCount: true,
            },
        });
        if (!post) {
            throw new Error('POST_NOT_FOUND');
        }
        return {
            title: post?.title,
            content: post?.content,
            publishDate: post?.createdAt,
            images: post?.images,
            tags: post?.tags,
            likesCount: post?.likesCount,
            commentsCount: post?.commentsCount,
        };
    }

    async deletePostById(postId: string, userId: string) {
        const post = await prisma.post.findFirst({
            where: {
                id: postId,
                authorId: userId,
            },
            select: {
                id: true,
                images: {
                    select: {
                        publicId: true,
                    },
                },
            },
        });

        if (!post) {
            throw new Error('POST_NOT_FOUND');
        }

        const publicIds = post.images.map((image) => image.publicId);
        if (post.images.length > 0) {
            await postUtils.deleteImages(publicIds);
        }

        await prisma.post.delete({
            where: {
                id: post.id,
            },
        });

        return true;
    }

    async getHomePosts(scope: string) {
        if (scope !== 'community' && scope !== 'admin') {
            throw new Error('Invalid scope');
        }

        const scopeEnum =
            scope === 'community' ? HomeScope.COMMUNITY : HomeScope.ADMIN;

        const rows = await prisma.homePost.findMany({
            where: { scope: scopeEnum },
            orderBy: { position: 'asc' },
            select: {
                postId: true,
            },
        });

        const ids: string[] = rows.map((row: { postId: string }) => row.postId);

        if (ids.length === 0) return [];

        let posts: any[] = await prisma.post.findMany({
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

                images: {
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                    select: {
                        imageUrl: true,
                        originalName: true,
                    },
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
                commentsCount: true,
            },
        });
        const postMap: { [key: string]: any } = {};

        for (const post of posts) {
            postMap[post.id] = post;
        }

        posts = ids.map((id) => postMap[id]).filter(Boolean);

        posts = posts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content.slice(0, 120),

            likesCount: post.likesCount,
            commentsCount: post.commentsCount,

            tags: post.tags,

            image: {
                url: post.images[0]?.imageUrl ?? null,
                name: post.images[0]?.originalName ?? null,
            },

            author: {
                name: post.author.name,
                avatar: post.author.avatar,

                tierName: post.author.tier?.name ?? null,
                badgeColor: post.author.tier?.badgeColor ?? null,
            },
        }));

        return { posts };
    }
}

export default new PostService();
