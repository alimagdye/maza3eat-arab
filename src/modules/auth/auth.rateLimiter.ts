import { createIPLimiter } from '../../middlewares/rateLimit/rateLimiter.factory.js';

const authRateLimiter = {
    oauthRateLimiter: createIPLimiter(
        50,
        'Too many OAuth requests. Please try again later.',
    ),

    logoutRateLimiter: createIPLimiter(
        20,
        'Too many logout requests. Please try again later.',
    ),

    refreshTokenRateLimiter: createIPLimiter(
        40,
        'Too many refresh token requests. Please try again later.',
    ),
};

export default authRateLimiter;
