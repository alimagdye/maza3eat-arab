import { Router } from 'express';
import answerController from './answer.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import answerValidation from './answer.validation.js';
import validate from '../../middlewares/validateRequest.js';
import answerRateLimiter from './answer.rateLimiter.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';

const router = Router({ mergeParams: true });

router.post(
    '/:questionId/answers',
    answerRateLimiter.preAuthLimiter,
    requireAuth,
    answerRateLimiter.createAnswerLimiter,
    answerValidation.validateCreateAnswer,
    validate,
    answerController.createAnswer,
);

router.get(
    '/:questionId/answers',
    answerRateLimiter.preAuthLimiter,
    optionalAuth,
    answerRateLimiter.getAnswersByQuestionId,
    answerValidation.validateGetAnswersByQuestionId,
    validate,
    answerController.getAnswersByQuestionId,
);

router.delete(
    '/:questionId/answers/:answerId',
    answerRateLimiter.preAuthLimiter,
    requireAuth,
    answerRateLimiter.deleteAnswerLimiter,
    answerValidation.validateDeleteAnswer,
    validate,
    answerController.deleteAnswerById,
);

export default router;
