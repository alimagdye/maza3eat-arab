import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const createLimiter = (max: number, message: string) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,

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

const createQuestionLimiter = createLimiter(
    10,
    'Too many question creation requests. Please try again later.',
);

const browseLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const searchLimiter = createLimiter(
    400,
    'Too many search requests. Please try again later.',
);

const getQuestionByIdLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const getQuestionsLimiter = (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    if (
        typeof req.query.search === 'string' &&
        req.query.search.trim() !== ''
    ) {
        return searchLimiter(req, res, next);
    }

    return browseLimiter(req, res, next);
};

const deleteQuestionByIdLimiter = createLimiter(
    20,
    'Too many delete requests. Please try again later.',
);

const questionRateLimiter = {
    createQuestionLimiter,
    getQuestionsLimiter,
    getQuestionByIdLimiter,
    deleteQuestionByIdLimiter,
};

export default questionRateLimiter;
