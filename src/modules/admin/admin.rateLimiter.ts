import { createIPLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const adminRateLimiter = {
    preAuthLimiter: createIPLimiter(400, 'Too many requests'),
};

export default adminRateLimiter;
