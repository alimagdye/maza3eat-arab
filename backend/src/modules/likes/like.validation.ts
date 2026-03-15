import { param, ValidationChain } from 'express-validator';

const likeValidation: {
    validateLikeOrUnlikePost: ValidationChain[];
} = {
    validateLikeOrUnlikePost: [
        param('postId')
            .isUUID()
            .withMessage('Invalid post ID format'),
    ],
};

export default likeValidation;
