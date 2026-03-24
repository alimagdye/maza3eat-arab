import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const likeOrUnlikePostLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,

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

const likeOrUnlikeCommentLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,

    keyGenerator: (req: Request) => {
        const userKey = req.user?.sub
            ? `user-${req.user.sub}`
            : ipKeyGenerator(req);

        const commentId = req.params.commentId || 'unknown';

        return `${userKey}-${commentId}`;
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        status: 'fail',
        message: 'Too many like/unlike attempts for this comment.',
    },
});

const likeOrUnlikeReplyLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,

    keyGenerator: (req: Request) => {
        const userKey = req.user?.sub
            ? `user-${req.user.sub}`
            : ipKeyGenerator(req);

        const replyId = req.params.replyId || 'unknown';

        return `${userKey}-${replyId}`;
    },

    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: 'fail',
        message: 'Too many like/unlike attempts for this reply.',
    },
});

const likeRateLimiter = {
    likeOrUnlikePostLimiter,
    likeOrUnlikeCommentLimiter,
    likeOrUnlikeReplyLimiter,
};

export default likeRateLimiter;
