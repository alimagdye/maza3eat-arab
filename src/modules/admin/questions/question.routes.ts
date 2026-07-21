import { Router } from 'express';

import questionController from './question.controller.js';
import questionValidation from './question.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import questionRateLimiter from './question.rateLimiter.js';

const router = Router();

router.post(
    '/',
    questionRateLimiter.createQuestionLimiter,
    questionValidation.validateCreateQuestion,
    validate,
    questionController.createQuestion,
);

router.get(
    '/',
    questionRateLimiter.getQuestionsLimiter,
    questionValidation.validateGetQuestions,
    validate,
    questionController.getQuestions,
);

router.get(
    '/:questionId',
    questionRateLimiter.getQuestionByIdLimiter,
    questionValidation.validateQuestionId,
    validate,
    questionController.getQuestionById,
);

router.patch(
    '/:questionId',
    questionRateLimiter.approveOrRejectQuestionLimiter,
    questionValidation.validateApproveOrRejectQuestion,
    validate,
    questionController.approveOrRejectQuestion,
);

router.delete(
    '/:questionId',
    questionRateLimiter.deleteQuestionByIdLimiter,
    questionValidation.validateQuestionId,
    validate,
    questionController.deleteQuestionById,
);

export default router;
