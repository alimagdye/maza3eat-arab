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

const adRateLimiter = {
    getPostAdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
};

export default adRateLimiter;
