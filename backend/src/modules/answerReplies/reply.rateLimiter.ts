import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const createLimiter = (max: number, message: string) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,

        keyGenerator: (req: Request) => {
            if (req.user?.sub) {
                return `user-${req.user.sub}`;
            }

            return ipKeyGenerator(req);
        },

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            status: 'fail',
            message,
        },
    });

const replyToAnswerLimiter = createLimiter(
    20,
    'Too many reply creation requests. Please try again later.',
);

const replyToReplyLimiter = createLimiter(
    15,
    'Too many reply creation requests. Please try again later.',
);

const deleteReplyLimiter = createLimiter(
    10,
    'Too many reply deletion requests. Please try again later.',
);

const getMoreRepliesLimiter = createLimiter(
    300,
    'Too many requests to get replies. Please try again later.',
);

export default {
    replyToAnswerLimiter,
    replyToReplyLimiter,
    deleteReplyLimiter,
    getMoreRepliesLimiter,
};
