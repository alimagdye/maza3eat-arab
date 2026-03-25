import { Router } from 'express';
import replyController from './reply.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import replyRateLimiter from './reply.rateLimiter.js';
import replyValidation from './reply.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';

const router = Router();

router.post(
    '/answers/:answerId/replies',
    requireAuth,
    replyRateLimiter.replyToAnswerLimiter,
    replyValidation.validateReplyToAnswer,
    validate,
    replyController.replyToAnswer,
);

router.post(
    '/answer-replies/:replyId/replies',
    requireAuth,
    replyRateLimiter.replyToReplyLimiter,
    replyValidation.validateReplyToReply,
    validate,
    replyController.replyToReply,
);

router.delete(
    '/answer-replies/:replyId',
    requireAuth,
    replyRateLimiter.deleteReplyLimiter,
    replyValidation.validateDeleteReply,
    validate,
    replyController.deleteReply,
);

router.get(
    '/answers/:answerId/replies',
    optionalAuth,
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByAnswerId,
    validate,
    replyController.getRepliesByAnswerId,
);

router.get(
    '/answer-replies/:replyId/replies',
    optionalAuth,
    replyRateLimiter.getMoreRepliesLimiter,
    replyValidation.validateGetRepliesByReplyId,
    validate,
    replyController.getRepliesByReplyId,
);

export default router;
