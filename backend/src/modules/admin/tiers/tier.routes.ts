import Router from 'express';
import tierController from './tier.controller.js';
import tierValidation from './tier.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import tierRateLimiter from './tier.rateLimiters.js';

const router = Router();

router.get(
    '/',
    tierRateLimiter.getTiersLimiter,
    validate,
    tierController.getTiers,
);

router.put(
    '/:tierId',
    tierRateLimiter.updateTierLimiter,
    tierValidation.validateUpdateTier,
    validate,
    tierController.updateTier,
);

export default router;
