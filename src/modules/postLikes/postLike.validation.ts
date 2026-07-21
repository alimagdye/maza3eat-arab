import { param, ValidationChain } from 'express-validator';

const likeValidation: {
    validateLikeOrUnlikePost: ValidationChain[];
    validateLikeOrUnlikeComment: ValidationChain[];
    validateLikeOrUnlikeReply: ValidationChain[];
} = {
    validateLikeOrUnlikePost: [
        param('postId').isUUID().withMessage('Invalid post ID format'),
    ],
    validateLikeOrUnlikeComment: [
        param('commentId').isUUID().withMessage('Invalid comment ID format'),
    ],
    validateLikeOrUnlikeReply: [
        param('replyId').isUUID().withMessage('Invalid reply ID format'),
    ],
};

export default likeValidation;
