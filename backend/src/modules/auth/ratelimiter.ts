import rateLimit from 'express-rate-limit';
import { ref } from 'process';

const authRateLimiter = {
    oauthRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // max 20 requests per IP per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many OAuth requests. Please try again later.',
        },
    }),

    userRateLimiter: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 100, // max 100 requests per IP per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many requests. Please try again later.',
        },
    }),

    logoutRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // max 5 requests per IP per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many logout requests. Please try again later.',
        },
    }),

    refreshTokenRateLimiter: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 10, // max 10 requests per IP per window
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message: 'Too many refresh token requests. Please try again later.',
        },
    }),
};

export default authRateLimiter;
