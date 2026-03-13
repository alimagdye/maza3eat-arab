import { Router } from 'express';

import postController from './post.controller.js';
import { uploadPostImages } from '../../middlewares/uploadPostImages.js';
import postValidation from './post.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import postRateLimiter from './post.rateLimiter.js';

const router = Router();

router.post(
    '/',
    postRateLimiter.createPostLimiter,
    requireAuth,
    uploadPostImages.array('images', 6),
    postValidation.validateCreatePost,
    validate,
    postController.createPost,
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
    postRateLimiter.deletePostByIdLimiter,
    requireAuth,
    postValidation.validateGetPostById,
    validate,
    postController.deletePostById,
);

export default router;
