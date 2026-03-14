import { Router } from 'express';
import likeController from './like.controller.js';
import { requireAuth } from '../../middlewares/requireAuth.js';
import likeValidation from './like.validation.js';
import validate from '../../middlewares/validateRequest.js';
import likeOrUnlikeRateLimiter from './like.rateLimiter.js';

const router = Router({ mergeParams: true });

// post like
router.post(
    '/:postId/like',
    likeOrUnlikeRateLimiter,
    requireAuth,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.likePost,
);

router.delete(
    '/:postId/like',
    likeOrUnlikeRateLimiter,
    requireAuth,
    likeValidation.validateLikeOrUnlikePost,
    validate,
    likeController.unlikePost,
);

// comment like
// router.post('/:commentId/like', requireAuth, likeController.likeComment);
// router.delete('/:commentId/like', requireAuth, likeController.unlikeComment);

// // reply like
// router.post('/:replyId/like', requireAuth, likeController.likeReply);
// router.delete('/:replyId/like', requireAuth, likeController.unlikeReply);

export default router;
