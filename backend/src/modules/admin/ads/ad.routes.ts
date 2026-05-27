import Router from 'express';
import AdController from './ad.controller.js';
import adRateLimiter from './ad.rateLimiter.js';
import adValidation from './ad.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import { uploadImages } from '../../../middlewares/uploadImages.js';

const router = Router();

router.post(
    '/',
    adRateLimiter.createAdLimiter,
    uploadImages({ fieldName: 'image', min: 1, max: 1 }),
    adValidation.validateCreateAd,
    validate,
    AdController.createAd,
);

router.get(
    '/',
    adRateLimiter.getAdsLimiter,
    adValidation.validateGetAds,
    validate,
    AdController.getAds,
);

router.put(
    '/:adId',
    adRateLimiter.updateAdLimiter,
    uploadImages({ fieldName: 'image', min: 0, max: 1 }),
    adValidation.validateUpdateAd,
    validate,
    AdController.updateAd,
);

router.delete(
    '/:adId',
    adRateLimiter.deleteAdLimiter,
    adValidation.validateDeleteAd,
    validate,
    AdController.deleteAd,
);

export default router;
