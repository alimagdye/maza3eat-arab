import { Router } from 'express';
import tagController from './tag.controller.js';
import tagRateLimiter from './tag.rateLimiter.js';
import tagValidation from './tag.validation.js';
import validate from '../../middlewares/validateRequest.js';
const router = Router();

router.get('/tags/trending', tagController.getTrendingTags);

router.get(
    '/tags/suggest',
    tagRateLimiter.suggestTagsLimiter,
    tagValidation.validateSuggestTags,
    validate,
    tagController.getSuggestedTags,
);

export default router;
