import publicPostService from '../../posts/post.service.js';
import NotificationService from '../../notifications/notification.service.js';
import { prisma } from '../../../lib/client.js';

class AdminPostService {
    createPost = publicPostService.createPost.bind(publicPostService);
    getPosts = publicPostService.getPosts.bind(publicPostService);
    getPostById = publicPostService.getPostById.bind(publicPostService);
    deletePostById = publicPostService.deletePostById.bind(publicPostService);
    notificationService = NotificationService;

    async approveOrRejectPost(
        postId: string,
        userId: string,
        action: 'approve' | 'reject',
        reason: string | null = null,
    ) {
        const result = await prisma.$transaction(async (tx) => {
            const post = await tx.post.findUnique({
                where: { id: postId },
                select: {
                    status: true,
                    authorId: true,
                    title: true,
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
                const data = await tx.post.update({
                    where: {
                        id: postId,
                    },
                    data: {
                        status: 'APPROVED',
                    },
                });

                return { data, recipientId: post.authorId };
            }

            // reject
            if (!reason?.trim()) {
                throw new Error('REJECTION_REASON_REQUIRED');
            }

            await this.deletePostById(postId, userId, 'ADMIN');

            // create audit log here
            // await tx.auditLog.create(...)

            return {
                data: {
                    rejected: true,
                },
                title: post.title,
                recipientId: post.authorId,
            };
        });

        if (action === 'approve') {
            await this.notificationService.createPostOrQuestionApprovalNotification(
                {
                    recipientId: result.recipientId,
                    actorId: userId,
                    type: 'POST_APPROVAL',
                    postId,
                },
            );
        } else {
            await this.notificationService.createPostOrQuestionRejectionNotification(
                {
                    recipientId: result.recipientId,
                    actorId: userId,
                    type: 'POST_REJECTION',
                    title: result.title as string,
                    reason: reason as string,
                },
            );
        }

        return result.data;
    }
}

export default new AdminPostService();
