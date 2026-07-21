import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const tierRateLimiter = {
    getTiersLimiter: createLimiter(
        400,
        'Too many search requests. Please try again later.',
    ),
    createTierLimiter: createLimiter(
        100,
        'Too many create requests. Please try again later.',
    ),
    updateTierLimiter: createLimiter(
        100,
        'Too many update requests. Please try again later.',
    ),
    deleteTierLimiter: createLimiter(
        100,
        'Too many delete requests. Please try again later.',
    ),
};

export default tierRateLimiter;
