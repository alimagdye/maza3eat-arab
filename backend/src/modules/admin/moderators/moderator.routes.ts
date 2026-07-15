import Router from 'express';
import moderatorController from './moderator.controller.js';
import moderatorValidation from './moderator.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import moderatorRateLimiter from './moderator.rateLimiter.js';

const router = Router();

router.get(
    '/',
    moderatorRateLimiter.getModeratorsLimiter,
    moderatorValidation.validateGetModerators,
    validate,
    moderatorController.getModerators,
);

router.put(
    '/:userId',
    moderatorRateLimiter.promoteToModeratorLimiter,
    moderatorValidation.validatePromoteToMderator,
    validate,
    moderatorController.promoteToModerator,
);

router.delete(
    '/:userId',
    moderatorRateLimiter.demoteModeratorLimiter,
    moderatorValidation.validateDemoteModerator,
    validate,
    moderatorController.demoteModerator,
);

export default router;
