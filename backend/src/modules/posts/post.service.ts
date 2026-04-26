import { prisma } from '../../lib/client.js';
import { normalizeArabic } from '../../utils/normalizeArabic.js';
import PostUtils from './post.utils.js';
import { HomeScope, HomeScopeType, ScopeCacheState } from '../../types/post.js';

class PostService {
    private postUtils = PostUtils;
    private homePostsCache: Record<HomeScopeType, ScopeCacheState> = {
        community: { data: [], expiresAt: 0, refreshPromise: null },
        admin: { data: [], expiresAt: 0, refreshPromise: null },
    };

    private readonly HOME_POSTS_TTL = 1000 * 60 * 60; // 1 Hour

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
        // -------------------------
        // 1. normalize base inputs
        // -------------------------
        const trimmedTitle = title?.trim();
        const trimmedContent = content?.trim();

        // -------------------------
        // 2. validation
        // -------------------------
        if (!trimmedTitle || trimmedTitle.length < 10) {
            throw new Error('Title must be at least 10 characters');
        }

        if (!trimmedContent || trimmedContent.length < 20) {
            throw new Error('Content must be at least 20 characters');
        }

        if (!uploads || uploads.length === 0) {
            throw new Error('Post must have at least 1 image');
        }

        if (uploads.length > 6) {
            throw new Error('Max 6 images');
        }

        if (!tags || tags.length === 0) {
            throw new Error('Post must have at least 1 tag');
        }

        if (tags.length > 10) {
            throw new Error('Max 10 tags');
        }

        // optional: validate uploads structure (defensive)
        for (const img of uploads) {
            if (!img.url || !img.publicId) {
                throw new Error('Invalid image data');
            }
        }

        // -------------------------
        // 3. normalize + dedupe tags
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

        const titleNormalized = normalizeArabic(trimmedTitle);

        // -------------------------
        // 4. transaction
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

            // create post
            const post = await tx.post.create({
                data: {
                    title: trimmedTitle,
                    titleNormalized,
                    content: trimmedContent,
                    authorId: userId,
                },
            });

            // insert images (bulk)
            await tx.postImage.createMany({
                data: uploads.map((img) => ({
                    postId: post.id,
                    imageUrl: img.url,
                    publicId: img.publicId,
                    originalName: img.originalName,
                    width: img.width,
                    height: img.height,
                })),
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
                    postId: post.id,
                    tagId,
                    name: tagMap.get(n)!,
                };
            });

            // bulk insert post tags
            await tx.postTag.createMany({
                data: relations,
            });

            return post;
        });
    }

    async getPosts(
        scope: string,
        sort: string,
        cursor: string | null = null,
        search: string = '',
    ) {
        const take = 10;

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

    async getPostById(postId: string, userId: string | null) {
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
                commentsCount: true,
                ...(userId && {
                    likes: {
                        where: { userId },
                        select: { userId: true },
                    },
                }),
            },
        });
        if (!post) {
            throw new Error('POST_NOT_FOUND');
        }
        const likedByMe = userId && post.likes ? post.likes.length > 0 : false;
        return {
            title: post?.title,
            content: post?.content,
            publishDate: post?.createdAt,
            author: {
                id: post?.author.id,
                name: post?.author.name,
                avatar: post?.author.avatar,
                tierName: post?.author.tier?.name ?? null,
                badgeColor: post?.author.tier?.badgeColor ?? null,
            },
            images: post?.images,
            tags: post?.tags,
            likesCount: post?.likesCount,
            commentsCount: post?.commentsCount,
            likedByMe,
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

                tags: {
                    select: {
                        tagId: true,
                    },
                },
            },
        });

        if (!post) {
            throw new Error('POST_NOT_FOUND');
        }

        const publicIds = post.images.map((image) => image.publicId);
        const tagIds = post.tags.map((tag) => tag.tagId);

        if (publicIds.length > 0) {
            await this.postUtils.deleteImages(publicIds);
        }

        await prisma.$transaction(async (tx) => {
            await tx.post.delete({
                where: {
                    id: post.id,
                },
            });

            if (tagIds.length > 0) {
                await tx.tag.deleteMany({
                    where: {
                        id: {
                            in: tagIds,
                        },
                        posts: {
                            none: {},
                        },
                    },
                });
            }
        });

        return true;
    }

    private async refreshHomePostsCache(scope: HomeScopeType) {
        const scopeEnum =
            scope === 'community' ? HomeScope.COMMUNITY : HomeScope.ADMIN;

        // Fetch ordered IDs for this specific scope
        const rows = await prisma.homePost.findMany({
            where: { scope: scopeEnum },
            orderBy: { position: 'asc' },
            select: { postId: true },
        });

        const ids = rows.map((row) => row.postId);

        // Handle empty state early
        if (ids.length === 0) {
            this.homePostsCache[scope].data = [];
            this.homePostsCache[scope].expiresAt =
                Date.now() + this.HOME_POSTS_TTL;
            return;
        }

        // Fetch actual post data
        const rawPosts = await prisma.post.findMany({
            where: {
                id: { in: ids },
                status: 'APPROVED',
            },
            select: {
                id: true,
                title: true,
                content: true,
                tags: { take: 4, select: { name: true } },
                images: {
                    take: 1,
                    orderBy: { createdAt: 'asc' },
                    select: { imageUrl: true, originalName: true },
                },
                author: {
                    select: {
                        name: true,
                        avatar: true,
                        tier: { select: { name: true, badgeColor: true } },
                    },
                },
                likesCount: true,
                commentsCount: true,
            },
        });

        // Re-order mapping
        const postMap: Record<string, any> = {};
        for (const post of rawPosts) {
            postMap[post.id] = post;
        }

        const formattedPosts = ids
            .map((id) => postMap[id])
            .filter(Boolean)
            .map((post) => ({
                id: post.id,
                title: post.title,
                content: post.content.slice(0, 450),
                likesCount: post.likesCount,
                commentsCount: post.commentsCount,
                tags: post.tags,
                image: {
                    url: post.images[0].imageUrl,
                    name: post.images[0].originalName,
                },
                author: {
                    name: post.author.name,
                    avatar: post.author.avatar,
                    tierName: post.author.tier?.name ?? null,
                    badgeColor: post.author.tier?.badgeColor ?? null,
                },
            }));

        // 3. Save directly to the specific scope's bucket
        this.homePostsCache[scope].data = formattedPosts;

        const jitter = Math.floor(Math.random() * 1000 * 60 * 5);
        this.homePostsCache[scope].expiresAt =
            Date.now() + this.HOME_POSTS_TTL + jitter;
    }

    // 4. Invalidation can now target a specific route, or clear everything
    public invalidateHomePostsCache(scope?: HomeScopeType) {
        if (scope) {
            this.homePostsCache[scope].expiresAt = 0;
        } else {
            this.homePostsCache.community.expiresAt = 0;
            this.homePostsCache.admin.expiresAt = 0;
        }
    }

    // 5. The hot path (reads the query param)
    public async getHomePosts(scope: string) {
        if (scope !== 'community' && scope !== 'admin') {
            throw new Error('Invalid scope');
        }

        const validScope = scope as HomeScopeType;

        // Grab the correct bucket using bracket notation
        const cache = this.homePostsCache[validScope];
        const now = Date.now();

        if (now > cache.expiresAt) {
            // Check the specific bucket's promise to prevent stampedes
            if (!cache.refreshPromise) {
                cache.refreshPromise = this.refreshHomePostsCache(validScope)
                    .catch((e) =>
                        console.error(
                            `Home posts refresh failed for ${validScope}:`,
                            e,
                        ),
                    )
                    .finally(() => (cache.refreshPromise = null));
            }

            // Cold-start protection per bucket
            if (cache.data.length === 0) {
                await cache.refreshPromise;
            }
        }

        // Return only the requested scope
        return { posts: this.homePostsCache[validScope].data };
    }
}

export default new PostService();
