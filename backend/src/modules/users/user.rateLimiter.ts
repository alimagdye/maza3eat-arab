import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const userRateLimiter = {
    preAuthLimiter: createLimiter(
        350,
        'Too many requests. Please try again later.',
    ),
    meLimiter: createLimiter(100, 'Too many requests. Please try again later.'),
    userPostsOrQuestionsLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
};

export default userRateLimiter;
