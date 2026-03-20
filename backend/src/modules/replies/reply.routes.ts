import { Router } from 'express';
import replyController from './reply.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import replyRateLimiter from './reply.rateLimiter.js';
import replyValidation from './reply.validation.js';
import validate from '../../middlewares/validateRequest.js';

const router = Router();

router.post(
    '/comments/:commentId/replies',
    requireAuth,
    replyRateLimiter.replyToCommentLimiter,
    replyValidation.validateReplyToComment,
    validate,
    replyController.replyToComment,
);

router.post(
    '/replies/:replyId/replies',
    requireAuth,
    replyRateLimiter.replyToReplyLimiter,
    replyValidation.validateReplyToReply,
    validate,
    replyController.replyToReply,
);

router.delete(
    '/replies/:replyId',
    requireAuth,
    replyRateLimiter.deleteReplyLimiter,
    replyValidation.validateDeleteReply,
    validate,
    replyController.deleteReply,
);

router.get(
    '/comments/:commentId/replies',
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByCommentId,
    validate,
    replyController.getRepliesByCommentId,
);

router.get(
    '/replies/:replyId/replies',
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByReplyId,
    validate,
    replyController.getRepliesByReplyId,
);

export default router;
