import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const notificationRateLimiter = {
    preAuthLimiter: createLimiter(
        120,
        'Too many requests. Please try again later.',
    ),
    notificationLimiter: createLimiter(
        100,
        'Too many requests. Please try again later.',
    ),
};

export default notificationRateLimiter;
