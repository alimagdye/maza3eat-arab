import { body, ValidationChain } from 'express-validator';

const reportValidation: {
    validateCreateReport: ValidationChain[];
} = {
    validateCreateReport: [
        body('targetId').isUUID().withMessage('Invalid reported item ID'),
        body('targetType')
            .notEmpty()
            .isIn([
                'COMMENT',
                'ANSWER',
                'COMMENT_REPLY',
                'ANSWER_REPLY',
                'ANSWER_REPLY_REPLY',
                'COMMENT_REPLY_REPLY',
                'CONTACT_REQUEST',
            ])
            .withMessage('Invalid target type'),
        body('reason')
            .notEmpty()
            .isLength({ min: 2, max: 200 })
            .withMessage('wrong reason length'),
    ],
};

export default reportValidation;
