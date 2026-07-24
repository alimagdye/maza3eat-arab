import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const moderatorRateLimiter = {
    getModeratorsLimiter: createLimiter(
        100,
        'Too many requests. Please try again later.',
    ),
    promoteToModeratorLimiter: createLimiter(
        40,
        'Too many promote requests. Please try again later.',
    ),
    demoteModeratorLimiter: createLimiter(
        30,
        'Too many demote requests. Please try again later.',
    ),
};

export default moderatorRateLimiter;
