import { prisma } from '../../prisma/client.js';

class LikeService {
    async likePost(userId: string, postId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.postLike.create({
                data: { userId, postId },
            });

            await tx.post.update({
                where: { id: postId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikePost(userId: string, postId: string) {
        await prisma.$transaction(async (tx) => {
            const result = await tx.postLike.deleteMany({
                where: { userId, postId },
            });

            if (result.count > 0) {
                await tx.post.update({
                    where: { id: postId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }
}

export default new LikeService();
