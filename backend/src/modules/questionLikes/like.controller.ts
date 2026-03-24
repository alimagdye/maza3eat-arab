import { Request, Response } from 'express';
import LikeService from './like.service.js';
import { Prisma } from '@prisma/client';

class LikeController {
    private likeService = LikeService;
    likeQuestion = async (req: Request, res: Response) => {
        const { questionId } = req.params as { questionId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.likeQuestion(userId, questionId);
            res.status(200).json({ status: 'success', liked: true });
        } catch (error: any) {
            console.error('Error liking question:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(200).json({
                        status: 'success',
                        message: 'Already liked',
                        liked: true,
                    });
                }

                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Question not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    unlikeQuestion = async (req: Request, res: Response) => {
        const { questionId } = req.params as { questionId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.unlikeQuestion(userId, questionId);

            return res.status(200).json({
                status: 'success',
                liked: false,
            });
        } catch (error: any) {
            console.error('Error unliking question:', error);

            if (error.message === 'QUESTION_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Question not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    voteAnswer = async (req: Request, res: Response) => {
        const { answerId } = req.params as { answerId: string };
        const value = req.body.value as 1 | -1;
        const userId = req.user.sub;

        try {
            const result = await this.likeService.voteAnswer(
                userId,
                answerId,
                value,
            );
            return res.status(201).json({ status: 'success', data: result });
        } catch (error: any) {
            console.error('Error voting answer:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Answer not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    likeReply = async (req: Request, res: Response) => {
        const { replyId } = req.params as { replyId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.likeReply(userId, replyId);
            res.status(200).json({ status: 'success', liked: true });
        } catch (error: any) {
            console.error('Error liking reply:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(200).json({
                        status: 'success',
                        message: 'Already liked',
                        liked: true,
                    });
                }

                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Reply not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    unlikeReply = async (req: Request, res: Response) => {
        const { replyId } = req.params as { replyId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.unlikeReply(userId, replyId);

            return res.status(200).json({
                status: 'success',
                liked: false,
            });
        } catch (error: any) {
            console.error('Error unliking reply:', error);

            if (error.message === 'REPLY_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Reply not found',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new LikeController();
