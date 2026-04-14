import { Request, Response, NextFunction } from 'express';
import {
    createIPLimiter,
    createLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const browseLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const searchLimiter = createLimiter(
    400,
    'Too many search requests. Please try again later.',
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

const questionRateLimiter = {
    preAuthLimiter: createIPLimiter(40, 'Too many requests'),
    createQuestionLimiter: createLimiter(
        10,
        'Too many question creation requests. Please try again later.',
    ),
    getQuestionsLimiter,
    getQuestionByIdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
    deleteQuestionByIdLimiter: createLimiter(
        20,
        'Too many delete requests. Please try again later.',
    ),
};

export default questionRateLimiter;
