import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,

    keyGenerator: (req) => {
        if (req.user?.sub) {
            return `user-${req.user.sub}`;
        }

        return ipKeyGenerator(req);
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        status: 'fail',
        message: 'Too many requests. Please try again later.',
    },
});

export default globalRateLimiter;
