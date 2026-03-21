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

const suggestTagsLimiter = createLimiter(
    400,
    'Too many requests for suggested tags. Please try again later.',
);

const tagRateLimiter = {
    suggestTagsLimiter,
};

export default tagRateLimiter;
