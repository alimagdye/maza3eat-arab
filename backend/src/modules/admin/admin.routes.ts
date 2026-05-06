import Router from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { UserRole } from '@prisma/client';
import { requireRole } from '../../middlewares/requireRole.js';
import adminRateLimiter from './admin.rateLimiter.js';
import adminPostRoutes from './posts/post.routes.js';
import adminQuestionRoutes from './questions/question.routes.js';
import adminUserRoutes from './users/user.routes.js';
import adminTierRoutes from './tiers/tier.routes.js';

const router = Router();

router.use(adminRateLimiter.preAuthLimiter);
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));
router.use('/posts', adminPostRoutes);
router.use('/questions', adminQuestionRoutes);
router.use('/users', adminUserRoutes);
router.use('/tiers', adminTierRoutes);

export default router;
