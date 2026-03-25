import { Request, Response } from 'express';
import AnswerService from './answer.service.js';
import { Prisma } from '@prisma/client';

class AnswerController {
    private answerService = AnswerService;
    createAnswer = async (req: Request, res: Response) => {
        try {
            const { questionId } = req.params as { questionId: string };
            const { content } = req.body;
            const userId = req.user.sub;

            const answer = await this.answerService.createAnswer(
                questionId,
                userId,
                content,
            );

            res.status(201).json({ status: 'success', data: answer });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'question_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'question not found',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025' || error.code === 'P2003') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'question not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getAnswersByQuestionId = async (req: Request, res: Response) => {
        try {
            const { questionId } = req.params as { questionId: string };
            const cursor = req.query.cursor as string | null;
            const userId = req.user ? req.user.sub : null;

            const data = await this.answerService.getAnswersByQuestionId(
                questionId,
                cursor,
                userId,
            );

            res.json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            if (error.message === 'question_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'question not found',
                });
            }
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    deleteAnswerById = async (req: Request, res: Response) => {
        try {
            const { answerId } = req.params as { answerId: string };
            const { questionId } = req.params as { questionId: string };
            const userId = req.user.sub;

            await this.answerService.deleteAnswerById(
                answerId,
                questionId,
                userId,
            );
            res.status(204).send();
        } catch (error: any) {
            console.error(error);
            if (error.message === 'answer_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'answer not found',
                });
            }
            if (error.message === 'UNAUTHORIZED') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not authorized to delete this answer',
                });
            }
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new AnswerController();
