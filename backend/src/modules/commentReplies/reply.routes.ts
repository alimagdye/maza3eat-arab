import { Router } from 'express';
import replyController from './reply.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import replyRateLimiter from './reply.rateLimiter.js';
import replyValidation from './reply.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';

const router = Router();

router.post(
    '/comments/:commentId/replies',
    replyRateLimiter.preAuthLimiter,
    requireAuth,
    replyRateLimiter.replyToCommentLimiter,
    replyValidation.validateReplyToComment,
    validate,
    replyController.replyToComment,
);

router.post(
    '/replies/:replyId/replies',
    replyRateLimiter.preAuthLimiter,
    requireAuth,
    replyRateLimiter.replyToReplyLimiter,
    replyValidation.validateReplyToReply,
    validate,
    replyController.replyToReply,
);

router.delete(
    '/replies/:replyId',
    replyRateLimiter.preAuthLimiter,
    requireAuth,
    replyRateLimiter.deleteReplyLimiter,
    replyValidation.validateDeleteReply,
    validate,
    replyController.deleteReply,
);

router.get(
    '/comments/:commentId/replies',
    optionalAuth,
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByCommentId,
    validate,
    replyController.getRepliesByCommentId,
);

router.get(
    '/replies/:replyId/replies',
    optionalAuth,
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByReplyId,
    validate,
    replyController.getRepliesByReplyId,
);

export default router;
