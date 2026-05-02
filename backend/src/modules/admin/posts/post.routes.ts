import Router from 'express';
import postController from './post.controller.js';
import postValidation from './post.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import { uploadPostImages } from '../../../middlewares/uploadPostImages.js';
import postRateLimiter from './post.rateLimiter.js';

const router = Router();

router.post(
    '/',
    postRateLimiter.createPostLimiter,
    uploadPostImages,
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
    postValidation.validatePostId,
    validate,
    postController.getPostById,
);

router.patch(
    '/:postId',
    postRateLimiter.approveOrRejectPostLimiter,
    postValidation.validateApproveOrRejectPost,
    validate,
    postController.approveOrRejectPost,
);

router.delete(
    '/:postId',
    postRateLimiter.deletePostByIdLimiter,
    postValidation.validatePostId,
    validate,
    postController.deletePostById,
);

export default router;
