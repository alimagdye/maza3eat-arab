import { Router } from 'express';
import announcementController from './announcement.controller.js';
import announcementValidation from './announcement.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import announcementRateLimiter from './announcement.rateLimiter.js';

const router = Router();

router.post(
    '/',
    announcementRateLimiter.createAnnouncementLimiter,
    announcementValidation.validateCreateAnnouncement,
    validate,
    announcementController.createAnnouncement,
);

router.get(
    '/',
    announcementRateLimiter.getAnnouncementsLimiter,
    announcementValidation.validateGetAnnouncements,
    validate,
    announcementController.getAnnouncements,
);

export default router;
