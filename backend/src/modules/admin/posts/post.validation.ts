import { body, param, query, ValidationChain } from 'express-validator';

const postValidation: {
    validateCreatePost: ValidationChain[];
    validateGetPosts: ValidationChain[];
    validatePostId: ValidationChain[];
    validateApproveOrRejectPost: ValidationChain[];
} = {
    validateCreatePost: [
        body('title')
            .isString()
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('Title must be between 3 and 200 characters'),
        body('content')
            .isString()
            .trim()
            .isLength({ min: 1, max: 5000 })
            .withMessage('Content is required'),
        body('tags')
            .toArray()
            .isArray({ min: 1, max: 10 })
            .withMessage('Tags must be min 1 and max 10'),
        body('tags.*')
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage(
                'Each tag must be a string between 1 and 30 characters',
            ),
    ],

    validateGetPosts: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
        query('search')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be between 1 and 100 characters'),
        query('status')
            .optional()
            .isIn(['pending', 'approved'])
            .withMessage('Invalid status option'),
    ],

    validatePostId: [
        param('postId').isUUID().withMessage('Invalid post ID format'),
    ],
    validateApproveOrRejectPost: [
        param('postId').isUUID().withMessage('Invalid post ID format'),
        body('action')
            .isIn(['approve', 'reject'])
            .withMessage('Action must be either approve or reject'),
        body('reason')
            .if(body('action').equals('reject'))
            .isString()
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage(
                'Reason is required when rejecting a post and must be between 1 and 500 characters',
            ),
    ],
};

export default postValidation;
