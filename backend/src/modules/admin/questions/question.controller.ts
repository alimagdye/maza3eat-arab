import { Request, Response } from 'express';
import QuestionService from './question.service.js';

class QuestionController {
    private questionService = QuestionService;

    createQuestion = async (req: Request, res: Response) => {
        const { title, content, tags } = req.body;
        const userId = req.user.sub;
        const role = req.user.role;

        try {
            const question = await this.questionService.createQuestion(
                title,
                content,
                tags,
                userId,
                role,
            );
            return res.status(201).json({
                status: 'success',
                data: question,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getQuestions = async (req: Request, res: Response) => {
        const cursor = req.query.cursor as string | null;
        const search: string = (req.query.search as string) || '';
        const status: string = (req.query.status as string) || 'PENDING';

        try {
            const result = await this.questionService.getQuestions(
                'latest',
                cursor,
                search,
                status,
            );

            return res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getQuestionById = async (req: Request, res: Response) => {
        const { questionId } = req.params as { questionId: string };
        const userId = req.user.sub;
        const role = req.user.role;

        try {
            const question = await this.questionService.getQuestionById(
                questionId,
                userId,
                role,
            );
            if (!question) {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'question not found' });
            }
            return res.status(200).json({ status: 'success', data: question });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'question_NOT_FOUND') {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'question not found' });
            }

            return res
                .status(500)
                .json({ status: 'error', message: 'Internal server error' });
        }
    };

    approveOrRejectQuestion = async (req: Request, res: Response) => {
        const userId = req.user.sub;
        const { questionId } = req.params as { questionId: string };
        const action = req.body.action as 'approve' | 'reject';
        const reason = req.body.reason as string | null;
        try {
            const post = await this.questionService.approveOrRejectQuestion(
                questionId,
                userId,
                action,
                reason,
            );

            return res.status(200).json({
                status: 'success',
                data: post,
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'QUESTION_ALREADY_REVIEWED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Question has already been reviewed',
                });
            }

            if (error.message === 'QUESTION_NOT_FOUND') {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'Question not found' });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    deleteQuestionById = async (req: Request, res: Response) => {
        const { questionId } = req.params as { questionId: string };
        const userId = req.user.sub;
        const role = req.user.role;

        try {
            await this.questionService.deleteQuestionById(
                questionId,
                userId,
                role,
            );

            return res.status(200).json({
                status: 'success',
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'question_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message:
                        'question not found or you do not have permission to delete it',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new QuestionController();
