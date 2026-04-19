import { Request, Response } from 'express';
import ReplyService from './reply.service.js';

class ReplyController {
    private replyService = ReplyService;
    replyToComment = async (req: Request, res: Response) => {
        const { commentId } = req.params as { commentId: string };
        const userId = req.user.sub;
        const { content } = req.body;

        try {
            const result = await this.replyService.replyToComment(
                commentId,
                userId,
                content,
            );

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Error in replyToComment:', error);

            if (error.message === 'COMMENT_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to create reply',
            });
        }
    };

    replyToReply = async (req: Request, res: Response) => {
        const { replyId } = req.params as { replyId: string };
        const userId = req.user.sub;
        const { content } = req.body;

        try {
            const result = await this.replyService.replyToReply(
                replyId,
                userId,
                content,
            );

            res.status(201).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error('Error in replyToReply:', error);

            if (error.message === 'REPLY_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Reply not found',
                });
            }

            if (error.message === 'MAX_DEPTH_REACHED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Max reply depth reached',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to create reply',
            });
        }
    };

    deleteReply = async (req: Request, res: Response) => {
        const { replyId } = req.params as { replyId: string };
        const userId = req.user.sub;

        try {
            await this.replyService.deleteReply(replyId, userId);

            res.status(200).json({
                status: 'success',
            });
        } catch (error: any) {
            console.error('Error in deleteReply:', error);

            if (error.message === 'REPLY_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Reply not found',
                });
            }

            if (error.message === 'FORBIDDEN') {
                return res.status(403).json({
                    status: 'fail',
                    message: 'Not allowed to delete this reply',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to delete reply',
            });
        }
    };

    getRepliesByCommentId = async (req: Request, res: Response) => {
        const { commentId } = req.params as { commentId: string };
        const cursor = (req.query.cursor as string) || null;
        const userId = req.user ? req.user.sub : null;
        const excludeReplyId = (req.query.excludeReplyId as string) || null;

        try {
            const result = await this.replyService.getRepliesByCommentId(
                commentId,
                cursor,
                userId,
                excludeReplyId,
            );

            res.json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'COMMENT_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Comment not found',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to get replies',
            });
        }
    };

    getRepliesByReplyId = async (req: Request, res: Response) => {
        const { replyId } = req.params as { replyId: string };
        const cursor = (req.query.cursor as string) || null;
        const userId = req.user ? req.user.sub : null;
        const excludeReplyId = (req.query.excludeReplyId as string) || null;

        try {
            const result = await this.replyService.getRepliesByReplyId(
                replyId,
                cursor,
                userId,
                excludeReplyId,
            );

            res.json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'REPLY_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Reply not found',
                });
            }

            res.status(500).json({
                status: 'error',
                message: 'Failed to get replies',
            });
        }
    };
}

export default new ReplyController();
