import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const moderatorRateLimiter = {
    getModeratorsLimiter: createLimiter(
        100,
        'Too many requests. Please try again later.',
    ),
    promoteToModeratorLimiter: createLimiter(
        20,
        'Too many promote requests. Please try again later.',
    ),
    demoteModeratorLimiter: createLimiter(
        20,
        'Too many demote requests. Please try again later.',
    ),
};

export default moderatorRateLimiter;
