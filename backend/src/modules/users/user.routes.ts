import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import userController from './user.controller.js';
import userRateLimiter from './user.rateLimiter.js';

const router = Router();

router.get(
    '/me',
    requireAuth,
    userRateLimiter.meLimiter,
    userController.me,
);

export default router;
