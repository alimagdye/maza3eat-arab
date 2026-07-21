import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const adRateLimiter = {
    getPostAdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
};

export default adRateLimiter;
