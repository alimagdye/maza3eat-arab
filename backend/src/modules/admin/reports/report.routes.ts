import { Router } from 'express';
import reportController from './report.controller.js';
import reportValidation from './report.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import reportRateLimiter from './report.rateLimiter.js';

const router = Router();

router.get(
    '/',
    reportRateLimiter.getReportsLimiter,
    reportValidation.validateGetReports,
    validate,
    reportController.getReport,
);

router.get(
    '/:reportId',
    reportRateLimiter.getReportByIdLimiter,
    reportValidation.validateGetReportById,
    validate,
    reportController.getReportById,
);

router.delete(
    '/:reportId',
    reportRateLimiter.deleteReportLimiter,
    reportValidation.validateGetReportById,
    validate,
    reportController.deleteReportById,
);

export default router;
