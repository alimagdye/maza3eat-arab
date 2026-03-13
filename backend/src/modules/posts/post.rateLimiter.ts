import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const createLimiter = (max: number, message: string) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 'fail',
            message,
        },
    });

const createPostLimiter = createLimiter(
    10,
    'Too many post creation requests. Please try again later.',
);

const browseLimiter = createLimiter(
    200,
    'Too many requests. Please try again later.',
);

const searchLimiter = createLimiter(
    400,
    'Too many search requests. Please try again later.',
);

const getPostByIdLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const getPostsLimiter = (req: Request, res: Response, next: NextFunction) => {
    if (
        typeof req.query.search === 'string' &&
        req.query.search.trim() !== ''
    ) {
        return searchLimiter(req, res, next);
    }

    return browseLimiter(req, res, next);
};

const deletePostByIdLimiter = createLimiter(
    20,
    'Too many delete requests. Please try again later.',
);

const postRateLimiter = {
    createPostLimiter,
    getPostsLimiter,
    getPostByIdLimiter,
    deletePostByIdLimiter,
};

export default postRateLimiter;
