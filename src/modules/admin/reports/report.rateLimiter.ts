import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const reportRateLimiter = {
    getReportsLimiter: createLimiter(
        400,
        'Too many report getting requests. Please try again later.',
    ),
    getReportByIdLimiter: createLimiter(
        300,
        'Too many report getting requests. Please try again later.',
    ),
    deleteReportLimiter: createLimiter(
        200,
        'Too many report deletion requests. Please try again later.',
    ),
};

export default reportRateLimiter;
