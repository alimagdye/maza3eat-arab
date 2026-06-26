import { prisma } from '../../../lib/client.js';
import publicQuestionService from '../../questions/question.service.js';
import NotificationService from '../../notifications/notification.service.js';

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
    notificationService = NotificationService;

    async approveOrRejectQuestion(
        questionId: string,
        userId: string,
        action: 'approve' | 'reject',
        reason: string | null = null,
    ) {
        const result = await prisma.$transaction(async (tx) => {
            const question = await tx.question.findUnique({
                where: { id: questionId },
                select: {
                    status: true,
                    authorId: true,
                    title: true,
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
                const data = await tx.question.update({
                    where: {
                        id: questionId,
                    },
                    data: {
                        status: 'APPROVED',
                    },
                });

                return { data, recipientId: question.authorId };
            }

            // reject
            if (!reason?.trim()) {
                throw new Error('REJECTION_REASON_REQUIRED');
            }

            await this.deleteQuestionById(questionId, userId, 'ADMIN');

            // create audit log here
            // await tx.auditLog.create(...)

            return {
                data: {
                    rejected: true,
                },
                title: question.title,
                recipientId: question.authorId,
            };
        });

        if (action === 'approve') {
            await this.notificationService.createPostOrQuestionApprovalNotification(
                {
                    recipientId: result.recipientId,
                    actorId: userId,
                    type: 'QUESTION_APPROVAL',
                    questionId,
                },
            );
        } else {
            await this.notificationService.createPostOrQuestionRejectionNotification(
                {
                    recipientId: result.recipientId,
                    actorId: userId,
                    type: 'QUESTION_REJECTION',
                    title: result.title as string,
                    reason: reason as string,
                },
            );
        }

        return result.data;
    }
}

export default new QuestionService();
