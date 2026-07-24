import { createIPLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const authRateLimiter = {
    oauthRateLimiter: createIPLimiter(
        20,
        'Too many OAuth requests. Please try again later.',
    ),

    logoutRateLimiter: createIPLimiter(
        10,
        'Too many logout requests. Please try again later.',
    ),

    refreshTokenRateLimiter: createIPLimiter(
        15,
        'Too many refresh token requests. Please try again later.',
    ),
};

export default authRateLimiter;
