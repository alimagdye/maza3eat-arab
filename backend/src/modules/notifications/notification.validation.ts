import { query, ValidationChain } from 'express-validator';

const notificationValidation: {
    validateGetNotifications: ValidationChain[];
} = {
    validateGetNotifications: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
};

export default notificationValidation;
