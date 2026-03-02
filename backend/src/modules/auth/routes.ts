import express from 'express';
import googleAuthController from './googleAuth.controller.js';
import authValidation from './validation.js';
import validate from '../../middlewares/validateRequest.js';
import authRateLimiter from './ratelimiter.js';
import authController from './auth.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
const router = express.Router();

router.get(
    '/google',
    authRateLimiter.oauthRateLimiter,
    googleAuthController.getAuthUrl,
);

router.get(
    '/google/callback',
    authRateLimiter.oauthRateLimiter,
    authValidation.validateHandleCallback,
    validate,
    googleAuthController.handleCallback,
);

router.get(
    '/me',
    authRateLimiter.userRateLimiter,
    requireAuth,
    authController.me,
);

router.post(
    '/logout',
    authRateLimiter.logoutRateLimiter,
    authController.logout,
);

router.post(
    '/refresh-token',
    authRateLimiter.refreshTokenRateLimiter,
    authController.refresh,
);

export default router;
