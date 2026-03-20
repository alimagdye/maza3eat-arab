import { Router } from 'express';

import postController from './post.controller.js';
import { uploadPostImages } from '../../middlewares/uploadPostImages.js';
import postValidation from './post.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import postRateLimiter from './post.rateLimiter.js';
import commentRoutes from '../comments/comment.routes.js';

const router = Router();

router.post(
    '/',
    requireAuth,
    postRateLimiter.createPostLimiter,
    uploadPostImages,
    postValidation.validateCreatePost,
    validate,
    postController.createPost,
);

router.get(
    '/home',
    postValidation.validateGetHomePosts,
    validate,
    postController.getHomePosts,
);

router.get(
    '/',
    postRateLimiter.getPostsLimiter,
    postValidation.validateGetPosts,
    validate,
    postController.getPosts,
);

router.get(
    '/:postId',
    postRateLimiter.getPostByIdLimiter,
    postValidation.validateGetPostById,
    validate,
    postController.getPostById,
);

router.delete(
    '/:postId',
    requireAuth,
    postRateLimiter.deletePostByIdLimiter,
    postValidation.validateGetPostById,
    validate,
    postController.deletePostById,
);

router.use('/', commentRoutes);

export default router;
