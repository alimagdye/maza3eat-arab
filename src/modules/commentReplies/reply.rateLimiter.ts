import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

export default {
    preAuthLimiter: createLimiter(
        350,
        'Too many requests. Please try again later.',
    ),
    replyToCommentLimiter: createLimiter(
        45,
        'Too many reply creation requests. Please try again later.',
    ),
    replyToReplyLimiter: createLimiter(
        40,
        'Too many reply creation requests. Please try again later.',
    ),
    deleteReplyLimiter: createLimiter(
        50,
        'Too many reply deletion requests. Please try again later.',
    ),
    getMoreRepliesLimiter: createLimiter(
        300,
        'Too many requests to get replies. Please try again later.',
    ),
};
