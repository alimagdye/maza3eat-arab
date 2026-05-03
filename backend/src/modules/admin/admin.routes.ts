import Router from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { UserRole } from '@prisma/client';
import { requireRole } from '../../middlewares/requireRole.js';
import adminPostRoutes from './posts/post.routes.js';
import adminQuestionRoutes from './questions/question.routes.js';
import adminRateLimiter from './admin.rateLimiter.js';

const router = Router();

router.use(adminRateLimiter.preAuthLimiter);
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));
router.use('/posts', adminPostRoutes);
router.use('/questions', adminQuestionRoutes);

export default router;
