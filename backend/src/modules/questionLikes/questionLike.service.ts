import { prisma } from '../../lib/client.js';

class LikeService {
    async likeQuestion(userId: string, questionId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.questionLike.create({
                data: { userId, questionId },
            });

            await tx.question.update({
                where: { id: questionId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikeQuestion(userId: string, questionId: string) {
        await prisma.$transaction(async (tx) => {
            // check question exists
            const question = await tx.question.findUnique({
                where: { id: questionId },
                select: { id: true },
            });

            if (!question) {
                throw new Error('QUESTION_NOT_FOUND');
            }

            const result = await tx.questionLike.deleteMany({
                where: { userId, questionId },
            });

            if (result.count > 0) {
                await tx.question.update({
                    where: { id: questionId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }

    async voteAnswer(userId: string, answerId: string, value: 1 | -1) {
        if (value !== 1 && value !== -1) {
            throw new Error('INVALID_VOTE');
        }

        return await prisma.$transaction(async (tx) => {
            const existingVote = await tx.answerVote.findUnique({
                where: {
                    userId_answerId: {
                        userId,
                        answerId,
                    },
                },
                select: { value: true },
            });

            // same vote  remove
            if (existingVote?.value === value) {
                await tx.answerVote.delete({
                    where: {
                        userId_answerId: {
                            userId,
                            answerId,
                        },
                    },
                });

                await tx.answer.update({
                    where: { id: answerId },
                    data: {
                        totalVoteValue: {
                            decrement: value,
                        },
                    },
                });

                return {
                    vote: 0,
                };
            }

            // switch vote
            else if (existingVote?.value === -value) {
                await tx.answerVote.update({
                    where: {
                        userId_answerId: {
                            userId,
                            answerId,
                        },
                    },
                    data: { value },
                });

                await tx.answer.update({
                    where: { id: answerId },
                    data: {
                        totalVoteValue: {
                            increment: 2 * value,
                        },
                    },
                });

                return {
                    vote: value,
                };
            }

            // new vote
            else {
                await tx.answerVote.create({
                    data: { userId, answerId, value },
                });

                await tx.answer.update({
                    where: { id: answerId },
                    data: {
                        totalVoteValue: {
                            increment: value,
                        },
                    },
                });

                return {
                    vote: value,
                };
            }
        });
    }

    async likeReply(userId: string, replyId: string) {
        await prisma.$transaction(async (tx) => {
            await tx.answerReplyLike.create({
                data: { userId, answerReplyId: replyId },
            });

            await tx.answerReply.update({
                where: { id: replyId },
                data: {
                    likesCount: { increment: 1 },
                },
            });
        });
    }

    async unlikeReply(userId: string, replyId: string) {
        await prisma.$transaction(async (tx) => {
            // check reply exists
            const reply = await tx.answerReply.findUnique({
                where: { id: replyId },
                select: { id: true },
            });

            if (!reply) {
                throw new Error('REPLY_NOT_FOUND');
            }

            const result = await tx.answerReplyLike.deleteMany({
                where: {
                    userId,
                    answerReplyId: replyId,
                },
            });

            if (result.count > 0) {
                await tx.answerReply.update({
                    where: { id: replyId },
                    data: {
                        likesCount: { decrement: 1 },
                    },
                });
            }
        });
    }
}

export default new LikeService();
