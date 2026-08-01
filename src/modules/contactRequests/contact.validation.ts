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
        body('type')
            .if(body('status').equals('ACCEPTED'))
            .isIn(['EMAIL', 'WHATSAPP', 'FACEBOOK', 'INSTAGRAM'])
            .withMessage('Invalid contact method type'),
        body('contactInfo')
            .if(body('status').equals('ACCEPTED'))
            .isString()
            .bail()
            .trim()
            .isLength({ min: 1, max: 200 })
            .withMessage('Invalid contact info'),
    ],
};

export default contactRequestValidation;
