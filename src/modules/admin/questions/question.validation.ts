import { body, param, query, ValidationChain } from 'express-validator';

const questionValidation: {
    validateCreateQuestion: ValidationChain[];
    validateGetQuestions: ValidationChain[];
    validateQuestionId: ValidationChain[];
    validateApproveOrRejectQuestion: ValidationChain[];
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

    validateQuestionId: [
        param('questionId').isUUID().withMessage('Invalid question ID format'),
    ],

    validateApproveOrRejectQuestion: [
        param('questionId').isUUID().withMessage('Invalid question ID format'),
        body('action')
            .isIn(['approve', 'reject'])
            .withMessage('Action must be either approve or reject'),
        body('reason')
            .if(body('action').equals('reject'))
            .isString()
            .trim()
            .isLength({ min: 1, max: 500 })
            .withMessage(
                'Reason is required when rejecting a question and must be between 1 and 500 characters',
            ),
    ],
};

export default questionValidation;
