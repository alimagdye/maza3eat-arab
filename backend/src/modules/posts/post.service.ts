import { prisma } from '../../prisma/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import postUtils from './post.utils.js';

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
        page: number,
        sort: string,
        search: string = '',
    ) {
        const take = 3;
        const skip = (page - 1) * take;

        const role = scope === 'community' ? 'USER' : 'ADMIN';

        const where: any = {
            status: 'APPROVED',

            author: {
                role,
            },
        };

        if (search && search.trim() !== '') {
            const s = normalizeArabic(search);

            const words = s.split(' ').filter((w) => w.length > 0);

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

        const orderBy =
            sort === 'popular'
                ? [
                      { likesCount: 'desc' as const },
                      { commentsCount: 'desc' as const },
                  ]
                : [{ createdAt: 'desc' as const }];

        const [posts, total] = await prisma.$transaction([
            prisma.post.findMany({
                where,
                orderBy,
                skip,
                take,

                select: {
                    id: true,
                    title: true,
                    content: true,

                    likesCount: true,
                    commentsCount: true,

                    createdAt: true,
                    tags: {
                        take: 4,
                        select: {
                            name: true,
                        },
                    },

                    images: {
                        take: 1,
                        orderBy: {
                            createdAt: 'asc',
                        },
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
                },
            }),

            prisma.post.count({
                where,
            }),
        ]);

        const totalPages = Math.ceil(total / take);

        const data = posts.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content.slice(0, 120),

            likesCount: post.likesCount,
            commentsCount: post.commentsCount,

            publishDate: post.createdAt,

            tags: post.tags,

            imageUrl: post.images[0]?.imageUrl ?? null,
            imageName: post.images[0]?.originalName ?? null,

            author: {
                name: post.author.name,
                avatar: post.author.avatar,

                tierName: post.author.tier?.name ?? null,
                badgeColor: post.author.tier?.badgeColor ?? null,
            },
        }));

        return {
            posts: data,
            totalPages,
            currentPage: page,
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
            throw new Error(
                'Post not found or you do not have permission to delete it',
            );
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
}

export default new PostService();
