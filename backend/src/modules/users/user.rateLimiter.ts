import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const userRateLimiter = {
    preAuthLimiter: createLimiter(
        120,
        'Too many requests. Please try again later.',
    ),
    meLimiter: createLimiter(100, 'Too many requests. Please try again later.'),
    userPostsLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
    userQuestionsLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
};

export default userRateLimiter;
