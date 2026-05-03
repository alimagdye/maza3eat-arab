import { Request, Response } from 'express';
import postUtils from '../../posts/post.utils.js';
import AdminPostService from './post.service.js';

class AdminPostController {
    private postService = AdminPostService;

    createPost = async (req: Request, res: Response) => {
        const { title, content, tags } = req.body;
        const userId = req.user.sub;
        const role = req.user.role;
        const files = req.files as Express.Multer.File[];

        // -------------------------
        // 1. Basic validation (cheap checks only)
        // -------------------------
        if (!Array.isArray(tags)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Tags must be an array',
            });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'At least 1 image required',
            });
        }

        if (files.length > 6) {
            return res.status(400).json({
                status: 'fail',
                message: 'Max 6 images',
            });
        }

        let uploads: {
            url: string;
            publicId: string;
            width: number;
            height: number;
            originalName: string;
        }[] = [];

        try {
            // -------------------------
            // 2. Upload images
            // -------------------------
            uploads = await Promise.all(
                files.map((file) =>
                    postUtils.uploadBuffer(file.buffer, file.originalname),
                ),
            );
            // -------------------------
            // 3. Create post
            // -------------------------
            const post = await this.postService.createPost(
                title,
                content,
                tags,
                userId,
                uploads,
                role,
            );
            return res.status(201).json({
                status: 'success',
                data: post,
            });
        } catch (error: any) {
            console.error(error);

            // -------------------------
            // 4. Cleanup uploaded images
            // -------------------------
            if (uploads.length > 0) {
                const publicIds = uploads.map((u) => u.publicId);

                await postUtils
                    .deleteImages(publicIds)
                    .catch((cleanupError) => {
                        console.error(
                            'CRITICAL: Failed to clean up orphaned images',
                            cleanupError,
                        );
                    });
            }

            // -------------------------
            // 5. Proper error response
            // -------------------------
            if (error instanceof Error) {
                // Sniff for our custom validation errors thrown from the service layer
                const isValidationError =
                    error.message.includes('must be') ||
                    error.message.includes('Max') ||
                    error.message.includes('Invalid') ||
                    error.message.includes('too long') ||
                    error.message.includes('too short') ||
                    error.message.includes('No valid tags');

                if (isValidationError) {
                    return res.status(400).json({
                        status: 'fail',
                        message: error.message,
                    });
                }
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getPosts = async (req: Request, res: Response) => {
        const cursor = req.query.cursor as string | null;
        const search: string = (req.query.search as string) || '';
        const status: string = (req.query.status as string) || 'PENDING';

        try {
            const result = await this.postService.getPosts(
                'community',
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

    getPostById = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };
        const userId = req.user.sub;
        const role = req.user.role;

        try {
            const post = await this.postService.getPostById(
                postId,
                userId,
                role,
            );
            if (!post) {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'Post not found' });
            }
            return res.status(200).json({ status: 'success', data: post });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'POST_NOT_FOUND') {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'Post not found' });
            }

            return res
                .status(500)
                .json({ status: 'error', message: 'Internal server error' });
        }
    };

    deletePostById = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };
        const userId = req.user.sub;
        const role = req.user.role;

        try {
            await this.postService.deletePostById(postId, userId, role);

            return res.status(200).json({
                status: 'success',
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'POST_NOT_FOUND') {
                return res.status(404).json({
                    status: 'fail',
                    message:
                        'Post not found or you do not have permission to delete it',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    approveOrRejectPost = async (req: Request, res: Response) => {
        const userId = req.user.sub;
        const { postId } = req.params as { postId: string };
        const action = req.body.action as 'approve' | 'reject';
        const reason = req.body.reason as string | null;
        try {
            const post = await this.postService.approveOrRejectPost(
                postId,
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

            if (error.message === 'POST_ALREADY_REVIEWED') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Post has already been reviewed',
                });
            }

            if (error.message === 'POST_NOT_FOUND') {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'Post not found' });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new AdminPostController();
