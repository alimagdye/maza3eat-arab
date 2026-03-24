import { ValidationChain, body, param, query } from 'express-validator';

const commentValidation: {
    validateCreateComment: ValidationChain[];
    validateDeleteComment: ValidationChain[];
    validateGetCommentsByPostId: ValidationChain[];
} = {
    validateCreateComment: [
        param('postId').isUUID().withMessage('Invalid post ID'),
        body('content')
            .isString()
            .trim()
            .isLength({ min: 1, max: 600 })
            .withMessage('Content must be between 1 and 600 characters'),
    ],
    validateDeleteComment: [
        param('postId').isUUID().withMessage('Invalid post ID'),
        param('commentId').isUUID().withMessage('Invalid comment ID'),
    ],
    validateGetCommentsByPostId: [
        param('postId').isUUID().withMessage('Invalid post ID'),
        query('cursor')
            .optional()
            .isUUID()
            .withMessage('Invalid cursor'),
    ],
};

export default commentValidation;
