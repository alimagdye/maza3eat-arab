import { body, param, query, ValidationChain } from 'express-validator';

const adValidation: {
    validateCreateAd: ValidationChain[];
    validateUpdateAd: ValidationChain[];
    validateDeleteAd: ValidationChain[];
    validateGetAds: ValidationChain[];
} = {
    validateCreateAd: [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Title is required')
            .isLength({ min: 3, max: 120 })
            .withMessage('Title must be between 3 and 120 characters'),

        body('text')
            .trim()
            .notEmpty()
            .withMessage('Text is required')
            .isLength({ min: 10, max: 1000 })
            .withMessage('Text must be between 10 and 1000 characters'),

        body('buttonText')
            .trim()
            .notEmpty()
            .withMessage('Button text is required')
            .isLength({ min: 2, max: 40 })
            .withMessage('Button text must be between 2 and 40 characters'),

        body('link')
            .trim()
            .notEmpty()
            .withMessage('Link is required')
            .isURL({
                protocols: ['http', 'https'],
                require_protocol: true,
            })
            .withMessage('Link must be a valid URL'),

        body('amountPaid')
            .notEmpty()
            .withMessage('Amount paid is required')
            .isFloat({ gt: 0 })
            .withMessage('Amount paid must be greater than 0')
            .toFloat(),

        body('expireAt')
            .notEmpty()
            .withMessage('Expire date is required')
            .isISO8601()
            .withMessage('Invalid date')
            .toDate()
            .custom((date) => date > new Date())
            .withMessage('Date must be in the future'),
    ],

    validateGetAds: [
        query('sort')
            .trim()
            .optional()
            .isIn(['expireAt', 'priority'])
            .withMessage('Sort must be either expireAt or priority'),
        query('cursor')
            .trim()
            .optional()
            .isUUID()
            .withMessage('Cursor must be a valid UUID'),
    ],

    validateUpdateAd: [
        param('adId').isUUID().withMessage('Invalid ad ID format'),

        body()
            .custom(
                ({
                    title,
                    text,
                    buttonText,
                    link,
                    amountPaid,
                    expireAt,
                    isActive,
                }) =>
                    [
                        title,
                        text,
                        buttonText,
                        link,
                        amountPaid,
                        expireAt,
                        isActive,
                    ].some((value) => value !== undefined),
            )
            .withMessage(
                'At least one field must be provided: title, text, buttonText, link, amountPaid, expireAt, isActive',
            ),

        body('title')
            .optional()
            .trim()
            .isLength({ min: 3, max: 120 })
            .withMessage('Title must be between 3 and 120 characters'),

        body('text')
            .optional()
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage('Text must be between 10 and 1000 characters'),

        body('buttonText')
            .optional()
            .trim()
            .isLength({ min: 2, max: 40 })
            .withMessage('Button text must be between 2 and 40 characters'),

        body('link')
            .optional()
            .trim()
            .isURL({
                protocols: ['http', 'https'],
                require_protocol: true,
            })
            .withMessage('Link must be a valid URL'),

        body('amountPaid')
            .optional()
            .isFloat({ gt: 0 })
            .withMessage('Amount paid must be greater than 0')
            .toFloat(),

        body('expireAt')
            .optional()
            .isISO8601()
            .withMessage('Invalid date')
            .toDate()
            .custom((date) => date > new Date())
            .withMessage('Date must be in the future'),

        body('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean')
            .toBoolean(),
    ],

    validateDeleteAd: [
        param('adId').isUUID().withMessage('Invalid ad ID format'),
    ],
};

export default adValidation;
