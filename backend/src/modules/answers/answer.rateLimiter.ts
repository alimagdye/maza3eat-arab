import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const createLimiter = (max: number, message: string) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: max,

        keyGenerator: (req: Request) => {
            if (req.user?.sub) {
                return `user-${req.user.sub}`;
            }

            return ipKeyGenerator(req);
        },

        standardHeaders: true,
        legacyHeaders: false,

        message: {
            status: 'fail',
            message,
        },
    });
};

const answerRateLimiter = {
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
