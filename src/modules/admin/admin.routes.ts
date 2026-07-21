import Router from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { UserRole } from '@prisma/client';
import { requireRole } from '../../middlewares/requireRole.js';
import adminRateLimiter from './admin.rateLimiter.js';
import PostRoutes from './posts/post.routes.js';
import QuestionRoutes from './questions/question.routes.js';
import UserRoutes from './users/user.routes.js';
import TierRoutes from './tiers/tier.routes.js';
import AdRoutes from './ads/ad.routes.js';
import ReportRoutes from './reports/report.routes.js';
import announcementRoutes from './notification/announcement.routes.js';
import moderatorRoutes from './moderators/moderator.routes.js';
import statisticsRoutes from './statistics/statistic.routes.js';

const router = Router();

router.use(adminRateLimiter.preAuthLimiter);
router.use(requireAuth);

// admin only routes
router.use('/moderators', requireRole([UserRole.ADMIN]), moderatorRoutes);
router.use('/ads', requireRole([UserRole.ADMIN]), AdRoutes);

// admin and moderator routes
router.use(
    '/statistics',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    statisticsRoutes,
);
router.use(
    '/posts',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    PostRoutes,
);
router.use(
    '/questions',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    QuestionRoutes,
);
router.use(
    '/users',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    UserRoutes,
);
router.use(
    '/tiers',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    TierRoutes,
);
router.use(
    '/reports',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    ReportRoutes,
);
router.use(
    '/announcements',
    requireRole([UserRole.ADMIN, UserRole.MODERATOR]),
    announcementRoutes,
);

export default router;
