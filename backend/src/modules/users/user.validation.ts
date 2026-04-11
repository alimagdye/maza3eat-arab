import { body, param, query, ValidationChain } from 'express-validator';

const userValidation: {
    validateUserPostsOrQuestions: ValidationChain[];
} = {
    validateUserPostsOrQuestions: [
        param('userId').isUUID().withMessage('Invalid user ID'),
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
};

export default userValidation;
