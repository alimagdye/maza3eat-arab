import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const likeRateLimiter = {
    preAuthLimiter: createIPLimiter(
        100,
        'Too many requests. Please try again later.',
    ),
    likeOrUnlikeQuestionLimiter: createLimiter(
        10,
        'Too many like/unlike attempts for this question.',
        'questionId',
    ),
    voteOrUnVoteAnswerLimiter: createLimiter(
        10,
        'Too many votes/unvotes attempts for this answer.',
        'answerId',
    ),
    likeOrUnlikeReplyLimiter: createLimiter(
        10,
        'Too many like/unlike attempts for this reply.',
        'replyId',
    ),
};

export default likeRateLimiter;
