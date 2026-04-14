import { Router } from 'express';

import questionController from './question.controller.js';
import questionValidation from './question.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import questionRateLimiter from './question.rateLimiter.js';
import answerRoutes from '../answers/answer.routes.js';
import { optionalAuth } from '../../middlewares/optionalAuth.js';

const router = Router();

router.post(
    '/',
    questionRateLimiter.preAuthLimiter,
    requireAuth,
    questionRateLimiter.createQuestionLimiter,
    questionValidation.validateCreateQuestion,
    validate,
    questionController.createQuestion,
);

router.get('/home', questionController.getHomeQuestions);

router.get(
    '/',
    optionalAuth,
    questionRateLimiter.getQuestionsLimiter,
    questionValidation.validateGetQuestions,
    validate,
    questionController.getQuestions,
);

router.get(
    '/popular',
    questionValidation.validateGetPopularQuestions,
    validate,
    questionController.getPopularQuestions,
);

router.get(
    '/:questionId',
    optionalAuth,
    questionRateLimiter.getQuestionByIdLimiter,
    questionValidation.validateQuestionId,
    validate,
    questionController.getQuestionById,
);

router.delete(
    '/:questionId',
    questionRateLimiter.preAuthLimiter,
    requireAuth,
    questionRateLimiter.deleteQuestionByIdLimiter,
    questionValidation.validateQuestionId,
    validate,
    questionController.deleteQuestionById,
);

router.use('/', answerRoutes);

export default router;
