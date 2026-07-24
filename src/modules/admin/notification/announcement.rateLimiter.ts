import { createLimiter } from '../../../middlewares/rateLimit/rateLimiter.factory.js';

const announcementRateLimiter = {
    createAnnouncementLimiter: createLimiter(
        5,
        'Too many announcement creation requests. Please try again later.',
    ),
    getAnnouncementsLimiter: createLimiter(
        100,
        'Too many requests. Please try again later.',
    ),
};

export default announcementRateLimiter;
