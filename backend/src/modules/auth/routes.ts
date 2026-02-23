import express from 'express';
import { googleAuthController } from './controller.js';
const router = express.Router();

router.get('/google', googleAuthController.getAuthUrl);
router.get('/google/callback', googleAuthController.handleCallback);
router.get('/me');
router.post('/logout');

export default router;
