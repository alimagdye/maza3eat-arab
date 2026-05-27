import Router from 'express';
import userController from './user.controller.js';
import userValidation from './user.validation.js';
import validate from '../../../middlewares/validateRequest.js';
import userRateLimiter from './user.rateLimiter.js';

const router = Router();

router.get(
    '/',
    userRateLimiter.getUsersLimiter,
    userValidation.validateGetUsers,
    validate,
    userController.getUsers,
);

router.patch(
    '/:userId/ban',
    userRateLimiter.banOrUnbanUserLimiter,
    userValidation.validateBanUser,
    validate,
    userController.banUser,
);

router.patch(
    '/:userId/unban',
    userRateLimiter.banOrUnbanUserLimiter,
    userValidation.validateUnBanUser,
    validate,
    userController.unbanUser,
);

router.patch(
    '/:userId/tier',
    userRateLimiter.updateUserTierLimiter,
    userValidation.validateUpdateUserTier,
    validate,
    userController.updateUserTier,
);

export default router;
