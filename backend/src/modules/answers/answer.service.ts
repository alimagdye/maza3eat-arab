import { prisma } from '../../lib/client.js';

class AnswerService {
    async createAnswer(questionId: string, userId: string, content: string) {
        return await prisma.$transaction(async (tx) => {
            const question = await tx.question.findUnique({
                where: { id: questionId },
                select: { id: true, status: true },
            });

            if (!question || question.status !== 'APPROVED') {
                throw new Error('question_NOT_FOUND');
            }

            const answer = await tx.answer.create({
                data: {
                    content,
                    questionId,
                    authorId: userId,
                },
                include: {
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
                },
            });

            await tx.question.update({
                where: { id: questionId },
                data: {
                    answersCount: {
                        increment: 1,
                    },
                },
            });

            return answer;
        });
    }

    async getAnswersByQuestionId(
        questionId: string,
        cursor: string | null = null,
        userId: string | null = null,
    ) {
        const pageSize = 5;

        const question = await prisma.question.findFirst({
            where: {
                id: questionId,
                status: 'APPROVED',
            },
        });

        if (!question) {
            throw new Error('question_NOT_FOUND');
        }

        const answers = await prisma.answer.findMany({
            where: { questionId },

            take: pageSize,

            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),

            orderBy: [{ totalVoteValue: 'desc' }, { id: 'desc' }],

            include: {
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
                ...(userId && {
                    votes: {
                        where: { userId },
                        select: { value: true },
                    },
                }),
            },
        });

        const nextCursor =
            answers.length === pageSize ? answers[answers.length - 1].id : null;

        const result = answers.map((answer) => {
            let myVote = 0;

            if (userId && answer.votes) {
                myVote = answer.votes[0]?.value ?? 0;
            }

            return {
                id: answer.id,
                questionId: answer.questionId,
                authorId: answer.authorId,
                content: answer.content,

                totalVoteValue: answer.totalVoteValue,
                repliesCount: answer.repliesCount,

                createdAt: answer.createdAt,

                author: {
                    id: answer.author.id,
                    name: answer.author.name,
                    avatar: answer.author.avatar,
                    tier: answer.author.tier,
                },

                myVote,
            };
        });

        return {
            answers: result,
            nextCursor,
            hasMore: answers.length === pageSize,
        };
    }

    async deleteAnswerById(
        answerId: string,
        questionId: string,
        userId: string,
    ) {
        return await prisma.$transaction(async (tx) => {
            const answer = await tx.answer.findUnique({
                where: { id: answerId },
                select: {
                    id: true,
                    questionId: true,
                    authorId: true,
                    repliesCount: true,
                },
            });

            if (!answer || answer.questionId !== questionId) {
                throw new Error('answer_NOT_FOUND');
            }

            if (answer.authorId !== userId) {
                throw new Error('UNAUTHORIZED');
            }

            await tx.answer.delete({
                where: { id: answerId },
            });

            await tx.question.update({
                where: { id: questionId },
                data: {
                    answersCount: {
                        decrement: 1 + answer.repliesCount,
                    },
                },
            });
        });
    }
}

export default new AnswerService();
