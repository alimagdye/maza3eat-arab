import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const suggestTagsLimiter = createLimiter(
    400,
    'Too many requests for suggested tags. Please try again later.',
);

const tagRateLimiter = {
    suggestTagsLimiter,
};

export default tagRateLimiter;
