import { param, ValidationChain } from 'express-validator';

const likeValidation: {
    validateLikeOrUnlikePost: ValidationChain[];
} = {
    validateLikeOrUnlikePost: [
        param('postId')
            .notEmpty()
            .isUUID()
            .withMessage('Invalid post ID format'),
    ],
};

export default likeValidation;
