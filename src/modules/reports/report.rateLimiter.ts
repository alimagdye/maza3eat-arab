import {
    createLimiter,
    createIPLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const reportRateLimiter = {
    preAuthLimiter: createIPLimiter(100, 'Too many requests'),
    createReportLimiter: createLimiter(
        20,
        'Too many report creation requests. Please try again later.',
    ),
};

export default reportRateLimiter;
