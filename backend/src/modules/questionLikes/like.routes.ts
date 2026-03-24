import { Router } from 'express';
import likeController from './like.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import likeValidation from './like.validation.js';
import validate from '../../middlewares/validateRequest.js';
import likeRateLimiter from './like.rateLimiter.js';

const router = Router();

router.post(
    '/questions/:questionId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeQuestionLimiter,
    likeValidation.validateLikeOrUnlikeQuestion,
    validate,
    likeController.likeQuestion,
);

router.delete(
    '/questions/:questionId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeQuestionLimiter,
    likeValidation.validateLikeOrUnlikeQuestion,
    validate,
    likeController.unlikeQuestion,
);

router.post(
    '/answers/:answerId/vote',
    requireAuth,
    likeRateLimiter.voteOrUnVoteAnswerLimiter,
    likeValidation.validateVoteOrUnVoteAnswer,
    validate,
    likeController.voteAnswer,
);

router.post(
    '/answer-replies/:replyId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.likeReply,
);

router.delete(
    '/answer-replies/:replyId/like',
    requireAuth,
    likeRateLimiter.likeOrUnlikeReplyLimiter,
    likeValidation.validateLikeOrUnlikeReply,
    validate,
    likeController.unlikeReply,
);

export default router;
