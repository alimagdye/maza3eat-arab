import { query, ValidationChain } from 'express-validator';

const tagValidation: {
    validateSuggestTags: ValidationChain[];
} = {
    validateSuggestTags: [
        query('search')
            .isString()
            .trim()
            .isLength({ min: 1, max: 30 })
            .withMessage('Search query must be between 1 and 30 characters'),
    ],
};

export default tagValidation;
