import { prisma } from '../../../lib/client.js';
import publicQuestionService from '../../questions/question.service.js';

class QuestionService {
    createQuestion = publicQuestionService.createQuestion.bind(
        publicQuestionService,
    );
    getQuestions = publicQuestionService.getQuestions.bind(
        publicQuestionService,
    );
    getQuestionById = publicQuestionService.getQuestionById.bind(
        publicQuestionService,
    );
    deleteQuestionById = publicQuestionService.deleteQuestionById.bind(
        publicQuestionService,
    );

    async approveOrRejectQuestion(
        questionId: string,
        userId: string,
        action: 'approve' | 'reject',
        reason: string | null = null,
    ) {
        return prisma.$transaction(async (tx) => {
            const question = await tx.question.findUnique({
                where: { id: questionId },
                select: {
                    status: true,
                },
            });

            if (!question) {
                throw new Error('QUESTION_NOT_FOUND');
            }

            // // only moderate pending questions
            if (question.status !== 'PENDING') {
                throw new Error('QUESTION_ALREADY_REVIEWED');
            }

            if (action === 'approve') {
                return tx.question.update({
                    where: {
                        id: questionId,
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

            await this.deleteQuestionById(questionId, userId, 'ADMIN');

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

export default new QuestionService();
