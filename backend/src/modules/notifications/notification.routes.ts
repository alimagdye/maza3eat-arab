import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import notificationController from './notification.controller.js';
import notificationValidation from './notification.validation.js';
import notificationRateLimiter from './notification.rateLimiter.js';
import validate from '../../middlewares/validateRequest.js';

const router = Router();

router.get(
    '/',
    notificationRateLimiter.preAuthLimiter,
    requireAuth,
    notificationRateLimiter.notificationLimiter,
    notificationValidation.validateGetNotifications,
    validate,
    notificationController.getNotifications,
);

router.get(
    '/unread-count',
    notificationRateLimiter.preAuthLimiter,
    requireAuth,
    notificationRateLimiter.notificationLimiter,
    notificationController.getUnreadNotificationCount,
);

router.get(
    '/:id',
    notificationRateLimiter.preAuthLimiter,
    requireAuth,
    notificationRateLimiter.notificationLimiter,
    notificationValidation.validateGetNotification,
    validate,
    notificationController.getNotificationById,
);

export default router;
