import {
    createLimiter,
    createIPLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';
import { Request, Response, NextFunction } from 'express';

const browseLimiter = createLimiter(
    300,
    'Too many requests. Please try again later.',
);

const searchLimiter = createLimiter(
    400,
    'Too many search requests. Please try again later.',
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

const postRateLimiter = {
    preAuthLimiter: createIPLimiter(400, 'Too many requests'),
    createPostLimiter: createLimiter(
        10,
        'Too many post creation requests. Please try again later.',
    ),
    getPostsLimiter,
    getPostByIdLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
    deletePostByIdLimiter: createLimiter(
        20,
        'Too many delete requests. Please try again later.',
    ),
};

export default postRateLimiter;
