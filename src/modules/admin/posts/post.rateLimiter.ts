import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const postRateLimiter = {
    createPostLimiter: createLimiter(
        30,
        'Too many post creation requests. Please try again later.',
    ),
    getPostsLimiter: createLimiter(
        400,
        'Too many search requests. Please try again later.',
    ),
    getPostByIdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
    approveOrRejectPostLimiter: createLimiter(
        60,
        'Too many approve/reject requests. Please try again later.',
    ),
    deletePostByIdLimiter: createLimiter(
        50,
        'Too many delete requests. Please try again later.',
    ),
};

export default postRateLimiter;
