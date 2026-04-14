import { Router } from 'express';
import commentController from './comment.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import commentValidation from './comment.validation.js';
import validate from '../../middlewares/validateRequest.js';
import commentRateLimiter from './comment.rateLimiter.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';

const router = Router({ mergeParams: true });

router.post(
    '/:postId/comments',
    commentRateLimiter.preAuthLimiter,
    requireAuth,
    commentRateLimiter.createCommentLimiter,
    commentValidation.validateCreateComment,
    validate,
    commentController.createComment,
);

router.get(
    '/:postId/comments',
    optionalAuth,
    commentRateLimiter.getCommentsByPostId,
    commentValidation.validateGetCommentsByPostId,
    validate,
    commentController.getCommentsByPostId,
);

router.delete(
    '/:postId/comments/:commentId',
    commentRateLimiter.preAuthLimiter,
    requireAuth,
    commentRateLimiter.deleteCommentLimiter,
    commentValidation.validateDeleteComment,
    validate,
    commentController.deleteCommentById,
);

export default router;
