import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

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

const meLimiter = createLimiter(
    100,
    'Too many requests. Please try again later.',
);

const userPostsLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const userQuestionsLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const userRateLimiter = {
    meLimiter,
    userPostsLimiter,
    userQuestionsLimiter,
};

export default userRateLimiter;
