import { body, param, query, ValidationChain } from 'express-validator';

const userValidation: {
    validateGetUsers: ValidationChain[];
    validateUnBanUser: ValidationChain[];
    validateBanUser: ValidationChain[];
    validateUpdateUserTier: ValidationChain[];
} = {
    validateGetUsers: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
        query('status')
            .optional()
            .isIn(['active', 'banned'])
            .withMessage('Invalid status option'),
    ],
    validateUnBanUser: [
        param('userId').isUUID().withMessage('Invalid user ID format'),
    ],
    validateBanUser: [
        param('userId').isUUID().withMessage('Invalid user ID format'),
        body('reason')
            .isString()
            .trim()
            .isLength({ min: 3, max: 500 })
            .withMessage('Ban reason must be between 3 and 500 characters'),
    ],
    validateUpdateUserTier: [
        param('userId').isUUID().withMessage('Invalid user ID format'),
        body('tierId').isInt({ min: 1 }).withMessage('Invalid tier ID'),
    ],
};

export default userValidation;
