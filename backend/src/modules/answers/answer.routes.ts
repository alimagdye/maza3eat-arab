import { Router } from 'express';
import answerController from './answer.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import answerValidation from './answer.validation.js';
import validate from '../../middlewares/validateRequest.js';
import answerRateLimiter from './answer.rateLimiter.js';

const router = Router({ mergeParams: true });

router.post(
    '/:questionId/answers',
    requireAuth,
    answerRateLimiter.createAnswerLimiter,
    answerValidation.validateCreateAnswer,
    validate,
    answerController.createAnswer,
);

router.get(
    '/:questionId/answers',
    answerRateLimiter.getAnswersByQuestionId,
    answerValidation.validateGetAnswersByQuestionId,
    validate,
    answerController.getAnswersByQuestionId,
);

router.delete(
    '/:questionId/answers/:answerId',
    requireAuth,
    answerRateLimiter.deleteAnswerLimiter,
    answerValidation.validateDeleteAnswer,
    validate,
    answerController.deleteAnswerById,
);

export default router;
