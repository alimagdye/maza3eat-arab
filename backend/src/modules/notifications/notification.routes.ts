import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import notificationController from './notification.controller.js';
import notificationValidation from './notification.validation.js';
import notificationRateLimiter from './notification.rateLimiter.js';

const router = Router();

router.get(
    '/',
    notificationRateLimiter.preAuthLimiter,
    requireAuth,
    notificationRateLimiter.notificationLimiter,
    notificationValidation.validateGetNotifications,
    notificationController.getNotifications,
);

router.get('/:id', requireAuth);

export default router;
