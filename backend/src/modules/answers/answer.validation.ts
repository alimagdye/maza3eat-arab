import { ValidationChain, body, param, query } from 'express-validator';

const answerValidation: {
    validateCreateAnswer: ValidationChain[];
    validateDeleteAnswer: ValidationChain[];
    validateGetAnswersByQuestionId: ValidationChain[];
} = {
    validateCreateAnswer: [
        param('questionId').isUUID().withMessage('Invalid question ID'),
        body('content')
            .isString()
            .trim()
            .isLength({ min: 1, max: 600 })
            .withMessage('Content must be between 1 and 600 characters'),
    ],
    validateDeleteAnswer: [
        param('questionId').isUUID().withMessage('Invalid question ID'),
        param('answerId').isUUID().withMessage('Invalid answer ID'),
    ],
    validateGetAnswersByQuestionId: [
        param('questionId').isUUID().withMessage('Invalid question ID'),
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
};

export default answerValidation;
