import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import userController from './user.controller.js';
import userRateLimiter from './user.rateLimiter.js';
import userValidation from './user.validation.js';
import validate from '../../middlewares/validateRequest.js';

const router = Router();

router.get(
    '/me',
    userRateLimiter.preAuthLimiter,
    requireAuth,
    userRateLimiter.meLimiter,
    userController.me,
);

router.get(
    '/:userId/posts',
    userRateLimiter.userPostsLimiter,
    userValidation.validateUserPostsOrQuestions,
    validate,
    userController.userPosts,
);

router.get(
    '/:userId/questions',
    userRateLimiter.userQuestionsLimiter,
    userValidation.validateUserPostsOrQuestions,
    validate,
    userController.userQuestions,
);

export default router;
