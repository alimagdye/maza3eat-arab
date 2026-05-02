import Router from 'express';
import { requireAuth } from '../../middlewares/requireAuth.js';
import { UserRole } from '@prisma/client';
import { requireRole } from '../../middlewares/requireRole.js';
import postAdminRoutes from './posts/post.routes.js';
import adminRateLimiter from './admin.rateLimiter.js';

const router = Router();

router.use(adminRateLimiter.preAuthLimiter);
router.use(requireAuth);
router.use(requireRole([UserRole.ADMIN]));
router.use('/posts', postAdminRoutes);

export default router;
