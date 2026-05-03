import publicPostService from '../../posts/post.service.js';
import { prisma } from '../../../lib/client.js';

class AdminPostService {
    createPost = publicPostService.createPost.bind(publicPostService);
    getPosts = publicPostService.getPosts.bind(publicPostService);
    getPostById = publicPostService.getPostById.bind(publicPostService);
    deletePostById = publicPostService.deletePostById.bind(publicPostService);

    async approveOrRejectPost(
        postId: string,
        userId: string,
        action: 'approve' | 'reject',
        reason: string | null = null,
    ) {
        return prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({
                where: { id: postId },
                select: {
                    status: true,
                },
            });

            if (!post) {
                throw new Error('POST_NOT_FOUND');
            }

            // // only moderate pending posts
            if (post.status !== 'PENDING') {
                throw new Error('POST_ALREADY_REVIEWED');
            }

            if (action === 'approve') {
                return tx.post.update({
                    where: {
                        id: postId,
                    },
                    data: {
                        status: 'APPROVED',
                    },
                });
            }

            // reject
            if (!reason?.trim()) {
                throw new Error('REJECTION_REASON_REQUIRED');
            }

            await this.deletePostById(postId, userId, 'ADMIN');

            // create notification here
            // await tx.notification.create(...)

            // create audit log here
            // await tx.auditLog.create(...)

            return {
                rejected: true,
            };
        });
    }
}

export default new AdminPostService();
