import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const likeOrUnlikeQuestionLimiter = rateLimit({
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

const voteOrUnVoteAnswerLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 10,

    keyGenerator: (req: Request) => {
        const userKey = req.user?.sub
            ? `user-${req.user.sub}`
            : ipKeyGenerator(req);

        const answerId = req.params.answerId || 'unknown';

        return `${userKey}-${answerId}`;
    },

    standardHeaders: true,
    legacyHeaders: false,

    message: {
        status: 'fail',
        message: 'Too many votes/unvotes attempts for this answer.',
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
    likeOrUnlikeQuestionLimiter,
    voteOrUnVoteAnswerLimiter,
    likeOrUnlikeReplyLimiter,
};

export default likeRateLimiter;
