import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const statisticRateLimiter = {
    getStatisticsLimiter: createLimiter(
        400,
        'Too many statistics getting requests. Please try again later.',
    ),
};

export default statisticRateLimiter;
