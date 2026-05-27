import { Router } from 'express';
import reportController from './report.controller.js';
import reportValidation from './report.validation.js';
import validate from '../../middlewares/validateRequest.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import reportRateLimiter from "./report.rateLimiter.js";

const router = Router();

router.post(
    '/',
    reportRateLimiter.preAuthLimiter,
    requireAuth,
    reportRateLimiter.createReportLimiter,
    reportValidation.validateCreateReport,
    validate,
    reportController.createReport,
);

export default router;
