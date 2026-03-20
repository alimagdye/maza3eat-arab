import { Request, Response } from 'express';
import LikeService from './like.service.js';
import { Prisma } from '@prisma/client';

class LikeController {
    private likeService = LikeService;
    likePost = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.likePost(userId, postId);
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error liking post:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        status: 'fail',
                        message: 'Already liked',
                    });
                }

                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Post not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    unlikePost = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.unlikePost(userId, postId);
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error unliking post:', error);

            if (error.message === 'Like not found') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Like or post not found',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025' || error.code === 'P2003') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Like or post not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    likeComment = async (req: Request, res: Response) => {
        const { commentId } = req.params as { commentId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.likeComment(userId, commentId);
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error liking comment:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        status: 'fail',
                        message: 'Already liked',
                    });
                }

                if (error.code === 'P2003' || error.code === 'P2025') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Comment not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    unlikeComment = async (req: Request, res: Response) => {
        const { commentId } = req.params as { commentId: string };
        const userId = req.user.sub;

        try {
            await this.likeService.unlikeComment(userId, commentId);
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error unliking comment:', error);

            if (error.message === 'Like not found') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Like or comment not found',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025' || error.code === 'P2003') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Like or comment not found',
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
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error liking reply:', error);

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        status: 'fail',
                        message: 'Already liked',
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
            res.status(200).json({ status: 'success' });
        } catch (error: any) {
            console.error('Error unliking reply:', error);

            if (error.message === 'Like not found') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Like or reply not found',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025' || error.code === 'P2003') {
                    return res.status(404).json({
                        status: 'fail',
                        message: 'Like or reply not found',
                    });
                }
            }

            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new LikeController();
