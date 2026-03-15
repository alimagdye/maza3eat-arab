import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const likeOrUnlikeLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,

    keyGenerator: (req: Request) => {
        const userKey = req.user?.sub
            ? `user-${req.user.sub}`
            : ipKeyGenerator(req);

        const postId = req.params.postId || 'unknown';

        return `${userKey}-${postId}`;
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        status: 'fail',
        message: 'Too many like/unlike attempts for this post.',
    },
});

const likeRateLimiter = {
    likeOrUnlikeLimiter,
};

export default likeRateLimiter;
