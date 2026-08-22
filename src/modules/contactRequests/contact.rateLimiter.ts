import {
    createLimiter,
    createIPLimiter,
} from '../../middlewares/rateLimit/rateLimiter.factory.js';

const contactRequestRateLimiter = {
    preAuthLimiter: createIPLimiter(350, 'Too many requests'),
    createContactRequestLimiter: createLimiter(
        10,
        'Too many contact request creation requests. Please try again later.',
    ),
    respondToContactRequestLimiter: createLimiter(
        50,
        'Too many contact request response requests. Please try again later.',
    ),
    getContactRequestByIdLimiter: createLimiter(
        310,
        'Too many requests. Please try again later.',
    ),
    getContactRequestsLimiter: createLimiter(
        300,
        'Too many requests. Please try again later.',
    ),
};

export default contactRequestRateLimiter;
