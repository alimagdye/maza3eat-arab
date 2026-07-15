import { param, query, ValidationChain } from 'express-validator';

const moderatorValidation: {
    validateGetModerators: ValidationChain[];
    validatePromoteToMderator: ValidationChain[];
    validateDemoteModerator: ValidationChain[];
} = {
    validateGetModerators: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
    validatePromoteToMderator: [
        param('userId').isUUID().withMessage('Invalid user ID format'),
    ],
    validateDemoteModerator: [
        param('userId').isUUID().withMessage('Invalid user ID format'),
    ],
};

export default moderatorValidation;
