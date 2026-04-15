import { param, query, ValidationChain } from 'express-validator';

const userValidation: {
    validateUserPostsOrQuestions: ValidationChain[];
    validateGetUser: ValidationChain[];
} = {
    validateUserPostsOrQuestions: [
        param('userId').isUUID().withMessage('Invalid user ID'),
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
    validateGetUser: [param('userId').isUUID().withMessage('Invalid user ID')],
};

export default userValidation;
