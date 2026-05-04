import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const userRateLimiter = {
    getUsersLimiter: createLimiter(
        400,
        'Too many search requests. Please try again later.',
    ),
    banOrUnbanUserLimiter: createLimiter(
        60,
        'Too many approve/reject requests. Please try again later.',
    ),
};

export default userRateLimiter;
