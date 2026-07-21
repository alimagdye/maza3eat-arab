import { query, ValidationChain } from 'express-validator';

const tagValidation: {
    validateSuggestTags: ValidationChain[];
    validateGetTrendingTags: ValidationChain[];
} = {
    validateSuggestTags: [
        query('search')
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Search query must be between 1 and 30 characters'),
    ],
    validateGetTrendingTags: [
        query('limit')
            .optional()
            .isInt({ min: 1, max: 10 })
            .withMessage('Limit must be an integer between 1 and 10'),
    ],
};

export default tagValidation;
