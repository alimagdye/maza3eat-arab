import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const likeRateLimiter = {
    preAuthLimiter: createIPLimiter(
        200,
        'Too many requests. Please try again later.',
    ),
    likeOrUnlikeQuestionLimiter: createLimiter(
        100,
        'Too many like/unlike attempts for this question.',
        'questionId',
    ),
    voteOrUnVoteAnswerLimiter: createLimiter(
        100,
        'Too many votes/unvotes attempts for this answer.',
        'answerId',
    ),
    likeOrUnlikeReplyLimiter: createLimiter(
        100,
        'Too many like/unlike attempts for this reply.',
        'replyId',
    ),
};

export default likeRateLimiter;
