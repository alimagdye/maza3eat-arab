import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const likeRateLimiter = {
    preAuthLimiter: createIPLimiter(
        200,
        'Too many like/unlike attempts. Please try again later.',
    ),
    likeOrUnlikePostLimiter: createLimiter(
        10,
        'Too many like/unlike attempts for this post.',
        'postId',
    ),
    likeOrUnlikeCommentLimiter: createLimiter(
        10,
        'Too many like/unlike attempts for this comment.',
        'commentId',
    ),
    likeOrUnlikeReplyLimiter: createLimiter(
        10,
        'Too many like/unlike attempts for this reply.',
        'replyId',
    ),
};

export default likeRateLimiter;
