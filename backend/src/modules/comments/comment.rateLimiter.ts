import {
    createLimiter,
    createIPLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const commentRateLimiter = {
    preAuthLimiter: createIPLimiter(
        60,
        'Too many requests from this IP, please try again later.',
    ),
    createCommentLimiter: createLimiter(
        20,
        'Too many comments created from this user, please try again later.',
    ),
    deleteCommentLimiter: createLimiter(
        50,
        'Too many comment deletions from this user, please try again later.',
    ),
    getCommentsByPostId: createLimiter(
        300,
        'Too many requests to get comments for this post, please try again later.',
    ),
};

export default commentRateLimiter;
