import { param, query, body, ValidationChain } from 'express-validator';

const contactRequestValidation: {
    validateGetContactRequests: ValidationChain[];
    validateGetContactRequestById: ValidationChain[];
    validateRespondToContactRequest: ValidationChain[];
    validateCreateContactRequest: ValidationChain[];
} = {
    validateCreateContactRequest: [
        body('receiverId').isUUID().withMessage('Invalid receiver ID'),
        body('reason').notEmpty().isLength({ min: 2, max: 200 }).withMessage('wrong reason length'),
    ],
    validateGetContactRequests: [
        query('cursor').optional().isUUID().withMessage('Invalid cursor'),
    ],
    validateGetContactRequestById: [
        param('id').isUUID().withMessage('Invalid contact request ID'),
    ],
    validateRespondToContactRequest: [
        param('id').isUUID().withMessage('Invalid contact request ID'),
        body('status').isIn(['ACCEPTED', 'DECLINED']).withMessage('Invalid status'),
    ],
};

export default contactRequestValidation;
