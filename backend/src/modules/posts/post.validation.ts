import { body, param, query, ValidationChain } from 'express-validator';

const postValidation: {
    validateCreatePost: ValidationChain[];
    validateGetPosts: ValidationChain[];
    validateGetPostById: ValidationChain[];
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
        query('page')
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('sort')
            .isIn(['latest', 'popular'])
            .withMessage('Invalid sort option'),
        query('scope')
            .isIn(['community', 'admin'])
            .withMessage('Invalid scope option'),
        query('search')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be between 1 and 100 characters'),
    ],

    validateGetPostById: [
        param('postId')
            .isUUID()
            .withMessage('Invalid post ID format'),
    ],
};

export default postValidation;
