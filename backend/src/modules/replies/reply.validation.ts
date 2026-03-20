import { body, param, query, ValidationChain } from 'express-validator';

const replyValidation: {
    validateReplyToComment: ValidationChain[];
    validateReplyToReply: ValidationChain[];
    validateDeleteReply: ValidationChain[];
    validateGetRepliesByCommentId: ValidationChain[];
    validateGetRepliesByReplyId: ValidationChain[];
} = {
    validateReplyToComment: [
        param('commentId').isUUID().withMessage('Invalid comment ID format'),
        body('content')
            .isString()
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Content must be between 1 and 1000 characters'),
    ],

    validateReplyToReply: [
        param('replyId').isUUID().withMessage('Invalid reply ID format'),
        body('content')
            .isString()
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Content must be between 1 and 1000 characters'),
    ],

    validateDeleteReply: [
        param('replyId').isUUID().withMessage('Invalid reply ID format'),
    ],

    validateGetRepliesByCommentId: [
        param('commentId').isUUID().withMessage('Invalid comment ID format'),
        query('cursor')
            .optional()
            .isUUID()
            .withMessage('Invalid cursor format'),
    ],

    validateGetRepliesByReplyId: [
        param('replyId').isUUID().withMessage('Invalid reply ID format'),
        query('cursor')
            .optional()
            .isUUID()
            .withMessage('Invalid cursor format'),
    ],
};

export default replyValidation;
