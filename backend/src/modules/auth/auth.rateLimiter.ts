import rateLimit from 'express-rate-limit';

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
