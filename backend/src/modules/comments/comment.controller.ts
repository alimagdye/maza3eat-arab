import { Request, Response } from 'express';
import CommentService from './comment.service.js';
import { Prisma } from '@prisma/client';

class CommentController {
    private commentService = CommentService;
    createComment = async (req: Request, res: Response) => {
        try {
            const { postId } = req.params as { postId: string };
            const { content } = req.body;
            const userId = req.user.sub;

            const comment = await this.commentService.createComment(
                postId,
                userId,
                content,
            );

            res.status(201).json({ status: 'success', data: comment });
        } catch (error: any) {
            console.error(error);
            if (error.message === 'POST_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found',
                });
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025' || error.code === 'P2003') {
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

    getCommentsByPostId = async (req: Request, res: Response) => {
        try {
            const { postId } = req.params as { postId: string };
            const cursor = req.query.cursor as string | null;

            const data = await this.commentService.getCommentsByPostId(
                postId,
                cursor,
            );

            res.json({
                status: 'success',
                data,
            });
        } catch (error: any) {
            if (error.message === 'POST_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Post not found',
                });
            }
            console.error(error);
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    deleteCommentById = async (req: Request, res: Response) => {
        try {
            const { commentId } = req.params as { commentId: string };
            const { postId } = req.params as { postId: string };
            const userId = req.user.sub;

            await this.commentService.deleteCommentById(
                commentId,
                postId,
                userId,
            );
            res.status(204).send();
        } catch (error: any) {
            console.error(error);
            if (error.message === 'COMMENT_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found',
                });
            }
            if (error.message === 'UNAUTHORIZED') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'You are not authorized to delete this comment',
                });
            }
            res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new CommentController();
