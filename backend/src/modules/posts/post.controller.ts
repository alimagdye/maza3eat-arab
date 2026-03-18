import { Request, Response } from 'express';
import PostService from './post.service.js';
import postUtils from './post.utils.js';

class PostController {
    private postService = PostService;

    createPost = async (req: Request, res: Response) => {
        const { title, content, tags } = req.body;
        const userId = req.user.sub;

        const files = req.files as Express.Multer.File[];

        if (!files || files.length < 1) {
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

        try {
            const uploads = await Promise.all(
                files.map((file) =>
                    postUtils.uploadBuffer(file.buffer, file.originalname),
                ),
            );

            const post = await this.postService.createPost(
                title,
                content,
                tags,
                userId,
                uploads,
            );
            return res.status(201).json({
                status: 'success',
                data: post,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };

    getPosts = async (req: Request, res: Response) => {
        const scope: string = (req.query.scope as string) || 'community';
        const cursor = req.query.cursor as string | null;
        const sort: string = (req.query.sort as string) || 'latest';
        const search: string = (req.query.search as string) || '';

        try {
            const result = await this.postService.getPosts(
                scope,
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

    getPostById = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };

        try {
            const post = await this.postService.getPostById(postId);
            if (!post) {
                return res
                    .status(404)
                    .json({ status: 'fail', message: 'Post not found' });
            }
            return res.status(200).json({ status: 'success', data: post });
        } catch (error) {
            console.error(error);
            return res
                .status(500)
                .json({ status: 'error', message: 'Internal server error' });
        }
    };

    deletePostById = async (req: Request, res: Response) => {
        const { postId } = req.params as { postId: string };
        const userId = req.user.sub;

        try {
            await this.postService.deletePostById(postId, userId);

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

    getHomePosts = async (req: Request, res: Response) => {
        const scope: string = (req.query.scope as string) || 'community';

        try {
            const posts = await this.postService.getHomePosts(scope);

            return res.status(200).json({
                status: 'success',
                data: posts,
            });
        } catch (error: any) {
            console.error(error);

            if (error.message === 'INVALID_SCOPE') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid scope',
                });
            }

            return res.status(500).json({
                status: 'error',
                message: 'Internal server error',
            });
        }
    };
}

export default new PostController();
