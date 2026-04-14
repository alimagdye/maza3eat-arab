import { createIPLimiter } from './rateLimiter.factory.js';

const globalRateLimiter = createIPLimiter(
    500,
    'Too many requests. Please try again later.',
);

export default globalRateLimiter;
