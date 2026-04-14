import rateLimit from 'express-rate-limit';
import { createIPLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const authRateLimiter = {
    oauthRateLimiter: createIPLimiter(
        10,
        'Too many OAuth requests. Please try again later.',
    ),

    logoutRateLimiter: createIPLimiter(
        5,
        'Too many logout requests. Please try again later.',
    ),

    refreshTokenRateLimiter: createIPLimiter(
        10,
        'Too many refresh token requests. Please try again later.',
    ),
};

export default authRateLimiter;
