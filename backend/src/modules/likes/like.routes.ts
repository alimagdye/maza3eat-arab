import { Router } from 'express';
import likeController from './like.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import likeValidation from './like.validation.js';
import validate from '../../middlewares/validateRequest.js';
import likeRateLimiter from './like.rateLimiter.js';

const router = Router();

router.post(
    '/posts/:postId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikePostLimiter,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.likePost,
);

router.delete(
    '/posts/:postId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikePostLimiter,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.unlikePost,
);

router.post(
    '/comments/:commentId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeCommentLimiter,
    likeValidation.validateLikeOrUnlikeComment,
    validate,
    likeController.likeComment,
);

router.delete(
    '/comments/:commentId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeCommentLimiter,
    likeValidation.validateLikeOrUnlikeComment,
    validate,
    likeController.unlikeComment,
);

router.post(
    '/replies/:replyId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.likeReply,
);

router.delete(
    '/replies/:replyId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.unlikeReply,
);

export default router;
