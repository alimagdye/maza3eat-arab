import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const questionRateLimiter = {
    createQuestionLimiter: createLimiter(
        30,
        'Too many question creation requests. Please try again later.',
    ),
    getQuestionsLimiter: createLimiter(
        400,
        'Too many search requests. Please try again later.',
    ),
    getQuestionByIdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
    approveOrRejectQuestionLimiter: createLimiter(
        60,
        'Too many approve/reject requests. Please try again later.',
    ),
    deleteQuestionByIdLimiter: createLimiter(
        50,
        'Too many delete requests. Please try again later.',
    ),
};

export default questionRateLimiter;
