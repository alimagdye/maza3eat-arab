import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const userKey = (req: Request) => req.user?.sub ?? ipKeyGenerator(req);

const authRateLimiter = {
    oauthRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many OAuth requests. Please try again later.',
        },
    }),

    userRateLimiter: rateLimit({
        windowMs: 60 * 60 * 1000,
        max: 100,
        keyGenerator: userKey,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many requests. Please try again later.',
        },
    }),

    logoutRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many logout requests. Please try again later.',
        },
    }),

    refreshTokenRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many refresh token requests. Please try again later.',
        },
    }),
};

export default authRateLimiter;
