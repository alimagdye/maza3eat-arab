import { Router } from 'express';
import likeController from './postLike.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import likeValidation from './postLike.validation.js';
import validate from '../../middlewares/validateRequest.js';
import likeRateLimiter from './postLike.rateLimiter.js';

const router = Router();

router.post(
    '/posts/:postId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikePostLimiter,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.likePost,
);

router.delete(
    '/posts/:postId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikePostLimiter,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.unlikePost,
);

router.post(
    '/comments/:commentId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikeCommentLimiter,
    likeValidation.validateLikeOrUnlikeComment,
    validate,
    likeController.likeComment,
);

router.delete(
    '/comments/:commentId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikeCommentLimiter,
    likeValidation.validateLikeOrUnlikeComment,
    validate,
    likeController.unlikeComment,
);

router.post(
    '/replies/:replyId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.likeReply,
);

router.delete(
    '/replies/:replyId/like',
    likeRateLimiter.preAuthLimiter,
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.unlikeReply,
);

export default router;
