import Router from 'express';
import homeAdController from './homeAd.controller.js';
import adRateLimiter from './ad.rateLimiter.js';
import homeAdValidation from './homeAd.validation.js';
import validate from '../../../middlewares/validateRequest.js';

const router = Router();

router.post(
    '/',
    adRateLimiter.createAdLimiter,
    homeAdValidation.validateCreateHomeAd,
    validate,
    homeAdController.createHomeAd,
);

router.get('/', adRateLimiter.getAdsLimiter, homeAdController.getHomeAds);

router.patch(
    '/:homeAdId',
    adRateLimiter.updateAdLimiter,
    homeAdValidation.validateUpdateHomeAd,
    validate,
    homeAdController.updateHomeAd,
);

router.delete(
    '/:homeAdId',
    adRateLimiter.deleteAdLimiter,
    homeAdValidation.validateDeleteHomeAd,
    validate,
    homeAdController.deleteHomeAd,
);

export default router;
