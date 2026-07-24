import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const notificationRateLimiter = {
    preAuthLimiter: createIPLimiter(
        200,
        'Too many requests. Please try again later.',
    ),
    notificationLimiter: createLimiter(
        150,
        'Too many requests. Please try again later.',
    ),
};

export default notificationRateLimiter;
