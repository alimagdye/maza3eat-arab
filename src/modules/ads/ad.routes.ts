import { Router } from 'express';
import adController from './ad.controller.js';
import adRateLimiter from './ad.rateLimiter.js';

const router = Router();

router.get('/post', adRateLimiter.getPostAdLimiter, adController.getPostAd);

router.get('/home', adController.getHomeAds);

export default router;