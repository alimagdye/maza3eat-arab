import { param, query, ValidationChain } from 'express-validator';

const notificationValidation: {
    validateGetNotifications: ValidationChain[];
    validateGetNotification: ValidationChain[];
} = {
    validateGetNotifications: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
    validateGetNotification: [
        param('id').isUUID().withMessage('Invalid notification ID'),
    ],
};

export default notificationValidation;
