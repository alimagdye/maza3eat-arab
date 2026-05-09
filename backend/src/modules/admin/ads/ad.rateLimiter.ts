import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const adRateLimiter = {
    createAdLimiter: createLimiter(
        30,
        'Too many ad creation requests. Please try again later.',
    ),
    getAdsLimiter: createLimiter(
        60,
        'Too many ad retrieval requests. Please try again later.',
    ),
    updateAdLimiter: createLimiter(
        30,
        'Too many ad update requests. Please try again later.',
    ),
    deleteAdLimiter: createLimiter(
        30,
        'Too many ad deletion requests. Please try again later.',
    ),
};

export default adRateLimiter;
