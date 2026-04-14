import { createLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const answerRateLimiter = {
    preAuthLimiter: createLimiter(
        70,
        'Too many requests from this user, please try again later.',
    ),
    createAnswerLimiter: createLimiter(
        20,
        'Too many answers created from this user, please try again later.',
    ),
    deleteAnswerLimiter: createLimiter(
        50,
        'Too many answer deletions from this user, please try again later.',
    ),
    getAnswersByQuestionId: createLimiter(
        300,
        'Too many requests to get answers for this question, please try again later.',
    ),
};

export default answerRateLimiter;
