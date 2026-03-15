import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const createLimiter = (max: number, message: string) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: max,

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
};

const commentRateLimiter = {
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
