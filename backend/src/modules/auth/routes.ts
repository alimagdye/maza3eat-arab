import express from 'express';
import  GoogleAuthController  from './controller.js';
const router = express.Router();

router.get('/google', GoogleAuthController.getAuthUrl);
router.get('/google/callback', GoogleAuthController.handleCallback);
// router.get('/me');
// router.post('/logout');

export default router;
