import { Request, Response } from 'express';
import QuestionService from './question.service.js';

class QuestionController {
    private questionService = QuestionService;

    createQuestion = async (req: Request, res: Response) => {
        const { title, content, tags } = req.body;
        const userId = req.user.sub;

        try {
            const question = await this.questionService.createQuestion(
                title,
                content,
                tags,
                userId,
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
        const sort: string = (req.query.sort as string) || 'latest';
        const search: string = (req.query.search as string) || '';

        try {
            const result = await this.questionService.getQuestions(
                sort,
                cursor,
                search,
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
        const userId = req.user ? req.user.sub : null;

        try {
            const question =
                await this.questionService.getQuestionById(questionId, userId);
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

    deleteQuestionById = async (req: Request, res: Response) => {
        const { questionId } = req.params as { questionId: string };
        const userId = req.user.sub;

        try {
            await this.questionService.deleteQuestionById(questionId, userId);

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

    getHomeQuestions = async (req: Request, res: Response) => {
        try {
            const questions = await this.questionService.getHomeQuestions();

            return res.status(200).json({
                status: 'success',
                data: questions,
            });
        } catch (error: any) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getPopularQuestions = async (req: Request, res: Response) => {
        try {
            const limit = parseInt(req.query.limit as string) || 10;

            const questions = await this.questionService.getPopularQuestions(limit);

            return res.status(200).json({
                status: 'success',
                data: questions,
            });
        } catch (error: any) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new QuestionController();
