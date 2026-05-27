import { body, param, query, ValidationChain } from 'express-validator';

const questionValidation: {
    validateCreateQuestion: ValidationChain[];
    validateGetQuestions: ValidationChain[];
    validateQuestionId: ValidationChain[];
    validateGetPopularQuestions: ValidationChain[];
} = {
    validateCreateQuestion: [
        body('title')
            .isString()
            .withMessage('title must be string')
            .trim()
            .isLength({ min: 3, max: 200 })
            .withMessage('bad title length'),
        body('content')
            .isString()
            .withMessage('content must be string')
            .trim()
            .isLength({ min: 3, max: 5000 })
            .withMessage('bad content length'),
        body('tags')
            .isArray({ min: 1, max: 10 })
            .withMessage('Tags must be min 1 and max 10'),
        body('tags.*')
            .isString()
            .trim()
            .isLength({ min: 3, max: 30 })
            .withMessage('bad tag length'),
    ],

    validateGetQuestions: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
        query('sort')
            .isIn(['latest', 'popular'])
            .withMessage('Invalid sort option'),
        query('search')
            .optional()
            .isString()
            .trim()
            .isLength({ min: 1, max: 100 })
            .withMessage('Search query must be between 1 and 100 characters'),
    ],

    validateQuestionId: [
        param('questionId').isUUID().withMessage('Invalid question ID format'),
    ],

    validateGetPopularQuestions: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Limit must be an integer between 1 and 10'),
    ],
};

export default questionValidation;
