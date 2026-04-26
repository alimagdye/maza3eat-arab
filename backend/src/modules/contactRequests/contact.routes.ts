import { Router } from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import contactRequestController from './contact.controller.js';
import contactRequestRateLimiter from './contact.rateLimiter.js';
import contactRequestValidation from './contact.validation.js';
import validate from '../../middlewares/validateRequest.js';

const router = Router();

router.post(
    '/',
    contactRequestRateLimiter.preAuthLimiter,
    requireAuth,
    contactRequestRateLimiter.createContactRequestLimiter,
    contactRequestValidation.validateCreateContactRequest,
    validate,
    contactRequestController.createContactRequest,
);

router.get(
    '/',
    contactRequestRateLimiter.preAuthLimiter,
    requireAuth,
    contactRequestRateLimiter.getContactRequestsLimiter,
    contactRequestValidation.validateGetContactRequests,
    validate,
    contactRequestController.getContactRequests,
);

router.patch(
    '/:id',
    contactRequestRateLimiter.preAuthLimiter,
    requireAuth,
    contactRequestRateLimiter.respondToContactRequestLimiter,
    contactRequestValidation.validateRespondToContactRequest,
    validate,
    contactRequestController.respondToContactRequest,
);

router.get(
    '/:id',
    contactRequestRateLimiter.preAuthLimiter,
    requireAuth,
    contactRequestRateLimiter.getContactRequestByIdLimiter,
    contactRequestValidation.validateGetContactRequestById,
    validate,
    contactRequestController.getContactRequestById,
);

export default router;
