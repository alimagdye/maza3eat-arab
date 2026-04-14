import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

export default {
    preAuthLimiter: createLimiter(
        40,
        'Too many requests. Please try again later.',
    ),
    replyToCommentLimiter: createLimiter(
        20,
        'Too many reply creation requests. Please try again later.',
    ),
    replyToReplyLimiter: createLimiter(
        15,
        'Too many reply creation requests. Please try again later.',
    ),
    deleteReplyLimiter: createLimiter(
        10,
        'Too many reply deletion requests. Please try again later.',
    ),
    getMoreRepliesLimiter: createLimiter(
        300,
        'Too many requests to get replies. Please try again later.',
    ),
};
