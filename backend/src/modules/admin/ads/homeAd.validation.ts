import { body, param, ValidationChain } from 'express-validator';

const homeAdValidation: {
    validateCreateHomeAd: ValidationChain[];
    validateUpdateHomeAd: ValidationChain[];
    validateDeleteHomeAd: ValidationChain[];
} = {
    validateCreateHomeAd: [
        body('adId').isUUID().withMessage('Invalid ad ID format'),
        body('adPosition')
            .isIn(['top', 'middle', 'bottom'])
            .withMessage('Invalid ad position'),
    ],

    validateUpdateHomeAd: [
        param('homeAdId').isUUID().withMessage('Invalid home ad ID format'),
        body('adId').isUUID().withMessage('Invalid ad ID format'),
    ],

    validateDeleteHomeAd: [
        param('homeAdId').isUUID().withMessage('Invalid home ad ID format'),
    ],
};

export default homeAdValidation;
