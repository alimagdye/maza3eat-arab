import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const tierRateLimiter = {
    getTiersLimiter: createLimiter(
        400,
        'Too many search requests. Please try again later.',
    ),

    updateTierLimiter: createLimiter(
        50,
        'Too many update requests. Please try again later.',
    ),
};

export default tierRateLimiter;
