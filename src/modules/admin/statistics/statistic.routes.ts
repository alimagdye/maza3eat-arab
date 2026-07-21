import { Router } from 'express';
import statisticController from './statistic.controller.js';
import statisticRateLimiter from './statistic.rateLimiter.js';

const router = Router();

router.get(
    '/',
    statisticRateLimiter.getStatisticsLimiter,
    statisticController.getStatistics,
);

export default router;
