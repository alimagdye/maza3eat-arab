import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

export default {
    preAuthLimiter: createIPLimiter(
        350,
        'Too many requests from this IP. Please try again later.',
    ),
    replyToAnswerLimiter: createLimiter(
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
